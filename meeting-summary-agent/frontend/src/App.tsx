import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ActionItem, AnalysisResponse, MeetingListResponse, MeetingRecord, QueryResponse } from './types';

const API = '/api';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? 'Request failed');
  }

  return data as T;
}

export default function App() {
  const [transcript, setTranscript] = useState(sampleTranscript);
  const [meetingTitle, setMeetingTitle] = useState('Engineering Sync');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [participants, setParticipants] = useState('Ava, Jordan, Priya');
  const [sendToSlack, setSendToSlack] = useState(false);
  const [slackMode, setSlackMode] = useState<'summary' | 'action_items' | 'decisions'>('action_items');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [query, setQuery] = useState('What decisions were made in the last API architecture meeting?');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [error, setError] = useState('');

  const participantList = useMemo(
    () => participants.split(',').map((item) => item.trim()).filter(Boolean),
    [participants]
  );

  useEffect(() => {
    void refreshMeetings();
  }, []);

  async function refreshMeetings() {
    setLoadingMeetings(true);
    setError('');
    try {
      const data = await requestJson<MeetingListResponse>('/meetings?limit=8');
      setMeetings(data.meetings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoadingMeetings(false);
    }
  }

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    setLoadingAnalyze(true);
    setError('');
    try {
      const data = await requestJson<AnalysisResponse>('/meetings/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title: meetingTitle,
          meetingDateTime: meetingDateTime || undefined,
          participants: participantList,
          transcript,
          sendToSlack,
          slackMode,
        }),
      });
      setAnalysis(data);
      await refreshMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze meeting');
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function handleQuery(event: FormEvent) {
    event.preventDefault();
    setLoadingQuery(true);
    setError('');
    try {
      const data = await requestJson<QueryResponse>('/assistant/query', {
        method: 'POST',
        body: JSON.stringify({ question: query }),
      });
      setQueryResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to answer question');
    } finally {
      setLoadingQuery(false);
    }
  }

  const latestActionItems: ActionItem[] = analysis?.meeting.actionItems ?? meetings.flatMap((meeting) => meeting.actionItems).slice(0, 6);

  return (
    <div className="shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <header className="hero card">
        <div>
          <p className="eyebrow">Groovy internal tool</p>
          <h1>AI Meeting Summary Agent</h1>
          <p className="lead">
            Convert transcripts into structured summaries, action items, decisions, risks, and Slack-ready updates.
          </p>
        </div>

        <div className="hero-stats">
          <Stat label="Stored meetings" value={meetings.length} />
          <Stat label="Slack mode" value={slackMode.replace('_', ' ')} />
          <Stat label="Action items" value={latestActionItems.length} />
        </div>
      </header>

      <main className="layout">
        <section className="card panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">1. Analyze meeting</p>
              <h2>Transcript to structured summary</h2>
            </div>
            <button className="ghost" onClick={() => setTranscript(sampleTranscript)} type="button">
              Load sample
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="form-grid">
            <label>
              Meeting title
              <input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Weekly engineering sync" />
            </label>

            <label>
              Meeting date and time
              <input value={meetingDateTime} onChange={(e) => setMeetingDateTime(e.target.value)} placeholder="2026-06-18T09:00:00Z" />
            </label>

            <label className="full-span">
              Participants, comma separated
              <input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Ava, Jordan, Priya" />
            </label>

            <label className="full-span">
              Transcript or notes
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={12} placeholder="Paste the meeting transcript here..." />
            </label>

            <div className="inline-options full-span">
              <label className="check">
                <input type="checkbox" checked={sendToSlack} onChange={(e) => setSendToSlack(e.target.checked)} />
                Send after save
              </label>

              <label>
                Slack mode
                <select value={slackMode} onChange={(e) => setSlackMode(e.target.value as typeof slackMode)}>
                  <option value="action_items">Action items</option>
                  <option value="summary">Summary</option>
                  <option value="decisions">Decisions</option>
                </select>
              </label>
            </div>

            <button className="primary full-span" type="submit" disabled={loadingAnalyze}>
              {loadingAnalyze ? 'Analyzing...' : 'Analyze and save'}
            </button>
          </form>
        </section>

        <section className="card panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">2. Retrieve history</p>
              <h2>Ask about past meetings</h2>
            </div>
          </div>

          <form onSubmit={handleQuery} className="query-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What decisions were made in the last API architecture meeting?" />
            <button className="primary" type="submit" disabled={loadingQuery}>
              {loadingQuery ? 'Searching...' : 'Ask'}
            </button>
          </form>

          <div className="divider" />

          {error ? <div className="alert error">{error}</div> : null}

          {queryResult ? (
            <article className="result-box">
              <h3>Assistant response</h3>
              <pre>{queryResult.answer}</pre>
            </article>
          ) : (
            <EmptyState title="Ask a question" description="Search past meetings for decisions, action items, or summaries." />
          )}
        </section>
      </main>

      <section className="grid-2">
        <section className="card panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">3. Summary preview</p>
              <h2>Latest analyzed meeting</h2>
            </div>
          </div>

          {analysis ? (
            <div className="summary-stack">
              <div className="summary-title">
                <h3>{analysis.meeting.title}</h3>
                <span>{formatDate(analysis.meeting.meetingDateTime)}</span>
              </div>

              <Block title="Overview" items={[analysis.meeting.overview]} />
              <Block title="Key discussion points" items={analysis.meeting.keyDiscussionPoints} />
              <Block title="Decisions" items={analysis.meeting.decisions} />
              <Block title="Risks & blockers" items={analysis.meeting.risksOrBlockers} />

              <div className="block">
                <h4>Action items</h4>
                {analysis.meeting.actionItems.length > 0 ? analysis.meeting.actionItems.map(renderActionItem) : <p className="muted">No action items were extracted.</p>}
              </div>

              <div className="meta-row">
                <span>LLM cost: {money(analysis.usage.estimatedCost)}</span>
                <span>Slack sent: {analysis.slackSent ? 'Yes' : 'No'}</span>
                <span>Status: {analysis.meeting.status}</span>
              </div>
            </div>
          ) : (
            <EmptyState title="No analysis yet" description="Paste a transcript and generate the first summary." />
          )}
        </section>

        <section className="card panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">4. Stored meetings</p>
              <h2>Recent records</h2>
            </div>
            <button className="ghost" type="button" onClick={refreshMeetings}>
              Refresh
            </button>
          </div>

          {loadingMeetings ? (
            <p className="muted">Loading saved meetings...</p>
          ) : meetings.length === 0 ? (
            <EmptyState title="No saved meetings" description="Analyze a transcript to populate the history list." />
          ) : (
            <div className="meeting-list">
              {meetings.map((meeting) => (
                <article className="meeting-card" key={meeting.id}>
                  <div className="meeting-card-head">
                    <h3>{meeting.title}</h3>
                    <span>{formatDate(meeting.meetingDateTime)}</span>
                  </div>
                  <p>{meeting.overview}</p>
                  <div className="tag-row">
                    <Tag>{meeting.actionItems.length} action items</Tag>
                    <Tag>{meeting.decisions.length} decisions</Tag>
                    <Tag>{meeting.participants.length} participants</Tag>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {latestActionItems.length > 0 ? (
        <section className="card panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Action items</p>
              <h2>Current extracted tasks</h2>
            </div>
          </div>

          <div className="action-grid">
            {latestActionItems.map((item, index) => (
              <article className="action-card" key={`${item.task}-${index}`}>
                <h3>{item.task}</h3>
                <p>Owner: {item.owner ?? 'Unassigned'}</p>
                <p>Deadline: {item.deadline ?? 'Missing'}</p>
                <Tag>{item.status}</Tag>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="block">
      <h4>{title}</h4>
      {items.length > 0 ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">Not mentioned in the transcript.</p>}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function renderActionItem(item: ActionItem, index: number) {
  return (
    <div className="action-item" key={`${item.task}-${index}`}>
      <div>
        <strong>{item.task}</strong>
        <p>Owner: {item.owner ?? 'Unassigned'}</p>
      </div>
      <span>{item.deadline ?? 'Missing'}</span>
    </div>
  );
}

const sampleTranscript = `Engineering Sync\n\nAva: We agreed to ship the API caching fix this week. Jordan will own the dashboard endpoint work.\nPriya: The mobile metrics export is blocked until the schema migration is finished.\nAva: Decisions made today: keep the current rollout plan, move the rate-limit change to Friday, and add a fallback path for stale cache reads.\nJordan: Action items are for me to patch the endpoint, Priya to verify the schema migration, and Ava to post an update in Slack tomorrow.\nPriya: The deadline for the cache fix is Thursday, and the fallback path must be ready before launch.`;