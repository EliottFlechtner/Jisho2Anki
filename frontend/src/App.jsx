import {useEffect, useMemo, useState} from 'react';

const TEXT_FIELDS = [
  'words',
  'output_path',
  'preset',
  'env_file',
  'pause_seconds',
  'candidate_limit',
  'sentence_count',
  'max_workers',
  'pitch_accent_theme',
  'furigana_format',
  'anki_url',
  'deck_name',
  'model_name',
  'tags',
  'field_word',
  'field_meaning',
  'field_reading',
  'sentence_deck_name',
  'sentence_model_name',
  'sentence_front_field',
  'sentence_back_field',
];

const CHECK_FIELDS = [
  'include_header',
  'include_sentences',
  'separate_sentence_cards',
  'include_pitch_accent',
  'include_furigana',
  'anki_connect',
  'review_before_anki',
  'allow_duplicates',
];

function buildInitialState(defaults) {
  const state = {};
  for (const key of TEXT_FIELDS) {
    state[key] = key in defaults ? String(defaults[key] ?? '') : '';
  }
  for (const key of CHECK_FIELDS) {
    state[key] = Boolean(defaults[key]);
  }
  return state;
}

function toFormData(formState, showOutputPath) {
  const data = new FormData();

  for (const key of TEXT_FIELDS) {
    if (key === 'output_path' && !showOutputPath) {
      continue;
    }
    data.append(key, formState[key] ?? '');
  }

  // Send explicit boolean values so unchecked toggles override preset defaults.
  for (const key of CHECK_FIELDS) {
    data.append(key, formState[key] ? 'true' : 'false');
  }

  return data;
}

export default function App() {
  const [bootLoaded, setBootLoaded] = useState(false);
  const [presets, setPresets] = useState([]);
  const [formState, setFormState] = useState(() => buildInitialState({}));
  const [statusText, setStatusText] = useState('Bootstrapping settings...');
  const [progress, setProgress] = useState({status: 'idle', completed: 0, total: 0, log: []});
  const [result, setResult] = useState({message: '', summary: ''});
  const [previewRows, setPreviewRows] = useState([]);
  const [previewSentenceRows, setPreviewSentenceRows] = useState([]);
  const [confirmationJobId, setConfirmationJobId] = useState('');
  const [confirmingAdd, setConfirmingAdd] = useState(false);
  const [jobId, setJobId] = useState('');
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [showOutputPath, setShowOutputPath] = useState(false);
  const [ankiModels, setAnkiModels] = useState([]);
  const [ankiDecks, setAnkiDecks] = useState([]);
  const [loadingAnkiOptions, setLoadingAnkiOptions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/bootstrap')
        .then((resp) => resp.json())
        .then((payload) => {
          if (!isMounted) {
            return;
          }
          const defaults = payload.defaults || {};
          const state = buildInitialState(defaults);
          state.words = '';
          setFormState(state);
          setPresets(payload.presets || []);
          setStatusText('Base defaults loaded. Select a preset to refill fields.');
          setBootLoaded(true);
        })
        .catch((error) => {
          if (!isMounted) {
            return;
          }
          setStatusText(`Failed to load defaults: ${error}`);
          setBootLoaded(true);
        });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/status/${jobId}`);
        const data = await resp.json();
        const total = Math.max(0, data.total || 0);
        const completed = Math.max(0, data.completed || 0);
        const log = data.log || [];

        setProgress({
          status: data.status || 'running',
          completed,
          total,
          log,
        });

        if (data.status === 'done') {
          setResult({message: data.message || '', summary: data.anki_summary || ''});
          setPreviewRows(data.preview || []);
          setPreviewSentenceRows(data.sentence_preview || []);
          setConfirmationJobId(data.requires_confirmation ? jobId : '');
          setStatusText('Generation complete.');
          setJobId('');
        }

        if (data.status === 'error') {
          setResult({message: `Error: ${data.error || 'unknown error'}`, summary: ''});
          setPreviewRows([]);
          setPreviewSentenceRows([]);
          setConfirmationJobId('');
          setStatusText('Generation failed.');
          setJobId('');
        }
      } catch (error) {
        setResult({message: `Polling error: ${error}`, summary: ''});
        setStatusText('Polling failed.');
        setJobId('');
      }
    }, 700);

    return () => clearInterval(interval);
  }, [jobId]);

  const progressPct = useMemo(() => {
    if (!progress.total) {
      return 0;
    }
    return Math.min(100, Math.floor((progress.completed / progress.total) * 100));
  }, [progress.completed, progress.total]);

  function updateField(key, value) {
    setFormState((prev) => ({...prev, [key]: value}));
  }

  async function applyPreset() {
    setLoadingPreset(true);
    setStatusText('Loading preset values...');

    try {
      const body = new URLSearchParams({
        preset: formState.preset || '',
        env_file: formState.env_file || '',
      });

      const resp = await fetch('/api/settings-preview', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body,
      });

      const payload = await resp.json();
      const merged = buildInitialState(payload.settings || {});
      merged.words = formState.words;
      merged.preset = payload.preset || '';
      merged.env_file = payload.env_file || '';
      setFormState(merged);
      setStatusText('Preset applied. Visible fields are the submitted values.');
    } catch (error) {
      setStatusText(`Could not apply preset: ${error}`);
    } finally {
      setLoadingPreset(false);
    }
  }

  async function startGeneration(event) {
    event.preventDefault();

    if (!formState.words.trim()) {
      setStatusText('Please add at least one word.');
      return;
    }

    setResult({message: '', summary: ''});
    setPreviewRows([]);
    setPreviewSentenceRows([]);
    setConfirmationJobId('');
    setProgress({status: 'starting', completed: 0, total: 0, log: []});
    setStatusText('Starting generation...');

    try {
      const resp = await fetch('/api/start', {
        method: 'POST',
        body: toFormData(formState, showOutputPath),
      });
      const payload = await resp.json();
      setJobId(payload.job_id || '');
      setStatusText('Generation in progress...');
    } catch (error) {
      setStatusText(`Failed to start generation: ${error}`);
    }
  }

  async function confirmAddToAnki() {
    if (!confirmationJobId) {
      return;
    }

    setConfirmingAdd(true);
    setStatusText('Submitting reviewed notes to Anki...');
    try {
      const resp = await fetch(`/api/confirm/${confirmationJobId}`, {method: 'POST'});
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload.error || 'confirm request failed');
      }
      setResult((prev) => ({...prev, summary: payload.anki_summary || prev.summary}));
      setConfirmationJobId('');
      setStatusText('Reviewed notes were added to Anki.');
    } catch (error) {
      setStatusText(`Could not confirm add: ${error}`);
    } finally {
      setConfirmingAdd(false);
    }
  }

  async function refreshAnkiOptions() {
    setLoadingAnkiOptions(true);
    try {
      const query = new URLSearchParams({anki_url: formState.anki_url || ''});
      const resp = await fetch(`/api/anki-options?${query.toString()}`);
      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload.error || 'could not fetch Anki options');
      }
      setAnkiModels(payload.models || []);
      setAnkiDecks(payload.decks || []);
      setStatusText('Loaded Anki model/deck lists.');
    } catch (error) {
      setStatusText(`Could not load Anki options: ${error}`);
      setAnkiModels([]);
      setAnkiDecks([]);
    } finally {
      setLoadingAnkiOptions(false);
    }
  }

  if (!bootLoaded) {
    return <div className="shell"><div className="status">Loading app...</div></div>;
  }

  const showSentenceCardSettings = formState.include_sentences && formState.separate_sentence_cards;

  return (
    <div className="shell">
      <main className="panel">
        <header className="hero">
          <p className="eyebrow">Jisho2Anki</p>
          <h1>Simple Japanese Card Generator</h1>
        </header>

        <div className="main-columns">
          <section className="status-column">
            <section className="status-block" aria-live="polite">
              <div className="status-head">{statusText}</div>
              <div className="progress-track"><div className="progress-fill" style={{width: `${progressPct}%`}} /></div>
              <div className="progress-meta">{progress.status} ({progress.completed}/{progress.total})</div>
              <pre className="log-box">{(progress.log || []).join('\n')}</pre>
              {result.message ? <p className="result-line">{result.message}</p> : null}
              {result.summary ? <p className="result-line">{result.summary}</p> : null}

              {previewRows.length > 0 ? (
                <details className="advanced-block" open={formState.review_before_anki}>
                  <summary>Generated card preview ({previewRows.length} shown)</summary>
                  <div className="log-box" style={{maxHeight: '280px', overflow: 'auto'}}>
                    {previewRows.map((row, index) => (
                      <div key={`${row.word}-${index}`} style={{marginBottom: '0.7rem'}}>
                        <strong>{index + 1}. {row.word}</strong><br />
                        Reading: {row.reading}<br />
                        Meaning: {row.meaning}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {previewSentenceRows.length > 0 ? (
                <details className="advanced-block">
                  <summary>Generated sentence-card preview ({previewSentenceRows.length} shown)</summary>
                  <div className="log-box" style={{maxHeight: '220px', overflow: 'auto'}}>
                    {previewSentenceRows.map((row, index) => (
                      <div key={`${row.front}-${index}`} style={{marginBottom: '0.7rem'}}>
                        <strong>{index + 1}. {row.front}</strong><br />
                        Back: {row.back}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {confirmationJobId ? (
                <button className="submit" type="button" onClick={confirmAddToAnki} disabled={confirmingAdd}>
                  {confirmingAdd ? 'Confirming...' : 'Confirm and Add Reviewed Notes to Anki'}
                </button>
              ) : null}
            </section>
          </section>

          <form onSubmit={startGeneration} className="stack settings-column">
            <section className="card">
              <h2>Setup</h2>
              <p className="hint">Use preset values as a starting point, then edit visible fields.</p>
              <div className="grid two">
                <label>Preset
                  <select value={formState.preset} onChange={(e) => updateField('preset', e.target.value)}>
                    <option value="">(none)</option>
                    {presets.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                  </select>
                </label>
                <label>Env file path (optional)
                  <input value={formState.env_file} onChange={(e) => updateField('env_file', e.target.value)} placeholder="configs/my-import.env" />
                </label>
              </div>
              <button type="button" className="ghost" onClick={applyPreset} disabled={loadingPreset}>
                {loadingPreset ? 'Applying Preset...' : 'Apply Preset To Form'}
              </button>
            </section>

            <div className="settings-grid">
              <div className="settings-subcolumn">
                <section className="card">
                  <h2>Input & Output</h2>
                  <div className="grid two">
                    <label className="full">Words (one per line)
                      <textarea value={formState.words} onChange={(e) => updateField('words', e.target.value)} placeholder={'食べる\n勉強\n試合'} />
                    </label>

                    <label className="toggle full">
                      <input type="checkbox" checked={showOutputPath} onChange={(e) => setShowOutputPath(e.target.checked)} />
                      Set custom Output TSV path
                    </label>

                    {showOutputPath ? (
                      <label className="full">Output TSV path
                        <input value={formState.output_path} onChange={(e) => updateField('output_path', e.target.value)} />
                      </label>
                    ) : null}
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={formState.include_header} onChange={(e) => updateField('include_header', e.target.checked)} />
                    Include header row in TSV
                  </label>
                </section>

                <section className="card">
                  <h2>Content Options</h2>
                  <div className="toggle-list">
                    <label className="toggle">
                      <input type="checkbox" checked={formState.include_sentences} onChange={(e) => updateField('include_sentences', e.target.checked)} />
                      Include example sentences
                    </label>
                    <label className="toggle">
                      <input type="checkbox" checked={formState.include_pitch_accent} onChange={(e) => updateField('include_pitch_accent', e.target.checked)} />
                      Include pitch accent SVG
                    </label>
                    <label className="toggle">
                      <input type="checkbox" checked={formState.include_furigana} onChange={(e) => updateField('include_furigana', e.target.checked)} />
                      Add furigana to word field
                    </label>
                  </div>

                  <div className="inline-options">
                    <label>Pitch SVG theme
                      <select value={formState.pitch_accent_theme} onChange={(e) => updateField('pitch_accent_theme', e.target.value)} disabled={!formState.include_pitch_accent}>
                        <option value="dark">dark</option>
                        <option value="light">light</option>
                      </select>
                    </label>
                    <label>Furigana format
                      <select value={formState.furigana_format} onChange={(e) => updateField('furigana_format', e.target.value)} disabled={!formState.include_furigana}>
                        <option value="ruby">ruby</option>
                        <option value="anki">anki</option>
                      </select>
                    </label>
                  </div>

                  {formState.include_sentences ? (
                    <div className="inline-options">
                      <label>Sentence count per word
                        <input type="number" min="0" step="1" value={formState.sentence_count} onChange={(e) => updateField('sentence_count', e.target.value)} />
                      </label>
                      <label className="toggle">
                        <input type="checkbox" checked={formState.separate_sentence_cards} onChange={(e) => updateField('separate_sentence_cards', e.target.checked)} />
                        Create separate sentence cards
                      </label>
                    </div>
                  ) : null}
                </section>
              </div>

              <div className="settings-subcolumn">
                <section className="card">
                  <h2>Destination</h2>
                  <label className="toggle">
                    <input type="checkbox" checked={formState.anki_connect} onChange={(e) => updateField('anki_connect', e.target.checked)} />
                    Send notes directly to AnkiConnect
                  </label>

                  {formState.anki_connect ? (
                    <button type="button" className="ghost" onClick={refreshAnkiOptions} disabled={loadingAnkiOptions}>
                      {loadingAnkiOptions ? 'Loading Anki Lists...' : 'Load Model & Deck Lists'}
                    </button>
                  ) : null}

                  {formState.anki_connect ? (
                    <>
                      <div className="grid two">
                        <label>AnkiConnect URL
                          <input value={formState.anki_url} onChange={(e) => updateField('anki_url', e.target.value)} />
                        </label>
                        <label>Deck name (destination)
                          <input list="deck-options" value={formState.deck_name} onChange={(e) => updateField('deck_name', e.target.value)} />
                          <datalist id="deck-options">
                            {ankiDecks.map((deck) => <option key={deck} value={deck} />)}
                          </datalist>
                        </label>
                        <label>Model name
                          <input list="model-options" value={formState.model_name} onChange={(e) => updateField('model_name', e.target.value)} />
                          <datalist id="model-options">
                            {ankiModels.map((model) => <option key={model} value={model} />)}
                          </datalist>
                        </label>
                        <label>Tags (comma-separated)
                          <input value={formState.tags} onChange={(e) => updateField('tags', e.target.value)} />
                        </label>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={formState.allow_duplicates} onChange={(e) => updateField('allow_duplicates', e.target.checked)} />
                        Allow duplicates in Anki
                      </label>
                      <label className="toggle">
                        <input type="checkbox" checked={formState.review_before_anki} onChange={(e) => updateField('review_before_anki', e.target.checked)} />
                        Review generated rows before sending to Anki
                      </label>

                      <details className="advanced-block">
                        <summary>Edit note field mapping</summary>
                        <div className="grid two">
                          <label>Word field
                            <input value={formState.field_word} onChange={(e) => updateField('field_word', e.target.value)} />
                          </label>
                          <label>Meaning field
                            <input value={formState.field_meaning} onChange={(e) => updateField('field_meaning', e.target.value)} />
                          </label>
                          <label>Reading field
                            <input value={formState.field_reading} onChange={(e) => updateField('field_reading', e.target.value)} />
                          </label>
                        </div>
                      </details>

                      {showSentenceCardSettings ? (
                        <details className="advanced-block" open>
                          <summary>Sentence card note mapping</summary>
                          <div className="grid two">
                            <label>Sentence deck
                              <input value={formState.sentence_deck_name} onChange={(e) => updateField('sentence_deck_name', e.target.value)} />
                            </label>
                            <label>Sentence model
                              <input value={formState.sentence_model_name} onChange={(e) => updateField('sentence_model_name', e.target.value)} />
                            </label>
                            <label>Sentence front field
                              <input value={formState.sentence_front_field} onChange={(e) => updateField('sentence_front_field', e.target.value)} />
                            </label>
                            <label>Sentence back field
                              <input value={formState.sentence_back_field} onChange={(e) => updateField('sentence_back_field', e.target.value)} />
                            </label>
                          </div>
                        </details>
                      ) : null}
                    </>
                  ) : (
                    <p className="hint">Cards will only be written to the TSV file.</p>
                  )}
                </section>

                <section className="card advanced-block">
                  <h2>Performance tuning</h2>
                  <div className="grid three">
                    <label>Pause seconds
                      <input type="number" min="0" step="0.1" value={formState.pause_seconds} onChange={(e) => updateField('pause_seconds', e.target.value)} />
                    </label>
                    <label>Candidate limit
                      <input type="number" min="1" step="1" value={formState.candidate_limit} onChange={(e) => updateField('candidate_limit', e.target.value)} />
                    </label>
                    <label>Max workers
                      <input type="number" min="1" step="1" value={formState.max_workers} onChange={(e) => updateField('max_workers', e.target.value)} />
                    </label>
                  </div>
                </section>

                <button className="submit" type="submit" disabled={Boolean(jobId)}>
                  {jobId ? 'Generating...' : 'Generate Cards'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
