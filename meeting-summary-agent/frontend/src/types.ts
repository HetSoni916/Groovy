export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  status: 'open' | 'in-progress' | 'done' | 'blocked';
}

export interface MeetingRecord {
  id: string;
  title: string;
  meetingDateTime: string;
  participants: string[];
  transcript: string;
  overview: string;
  keyDiscussionPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  risksOrBlockers: string[];
  deadlineWarnings: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResponse {
  meeting: MeetingRecord;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
  slackSent: boolean;
}

export interface MeetingListResponse {
  meetings: MeetingRecord[];
}

export interface QueryResponse {
  answer: string;
  queryPlan: {
    intent: string;
    keywords: string[];
    dateHint: string | null;
    limit: number;
  };
  meetings: MeetingRecord[];
}