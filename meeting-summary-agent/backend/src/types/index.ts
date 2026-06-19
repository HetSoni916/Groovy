export type MeetingStatus = 'draft' | 'completed' | 'needs-follow-up';

export type SlackShareMode = 'summary' | 'action_items' | 'decisions';

export interface MeetingInput {
  title?: string;
  meetingDateTime?: string;
  participants?: string[];
  transcript: string;
  status?: MeetingStatus;
}

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  status: 'open' | 'in-progress' | 'done' | 'blocked';
}

export interface MeetingAnalysis {
  title: string;
  overview: string;
  keyDiscussionPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  risksOrBlockers: string[];
  participants: string[];
  deadlineWarnings: string[];
}

export interface MeetingRecord extends MeetingAnalysis {
  id: string;
  meetingDateTime: string;
  transcript: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredActionItem extends ActionItem {
  id: string;
  meetingId: string;
  createdAt: string;
}

export interface QueryPlan {
  intent: 'search' | 'summary' | 'decisions' | 'action_items';
  keywords: string[];
  dateHint: string | null;
  limit: number;
}

export interface SlackPayloadRequest {
  meeting: MeetingRecord;
  mode: SlackShareMode;
}

export interface AnalyzeMeetingRequest extends MeetingInput {
  sendToSlack?: boolean;
  slackMode?: SlackShareMode;
}

export interface QueryRequest {
  question: string;
}