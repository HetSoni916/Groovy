import { getActionItemsForMeeting, getMeetingById, getRecentActionItems, insertMeeting, listMeetings, searchMeetings } from '../database/meetingModel';
import { ActionItem, MeetingAnalysis, MeetingRecord, MeetingStatus } from '../types';
import { logger } from '../utils/logger';

export const databaseTool = {
  saveMeeting(analysis: MeetingAnalysis, transcript: string, meetingDateTime: string, status: MeetingStatus): MeetingRecord {
    logger.info('db.save_meeting.start', { title: analysis.title });
    const meeting = insertMeeting(analysis, transcript, meetingDateTime, status);
    logger.info('db.save_meeting.success', { meetingId: meeting.id, actionItems: meeting.actionItems.length });
    return meeting;
  },

  getMeetingById(id: string): MeetingRecord | null {
    logger.info('db.get_meeting', { meetingId: id });
    return getMeetingById(id);
  },

  listMeetings(limit = 20): MeetingRecord[] {
    logger.info('db.list_meetings', { limit });
    return listMeetings(limit);
  },

  searchMeetings(query: string, limit = 10): MeetingRecord[] {
    logger.info('db.search_meetings', { query, limit });
    return searchMeetings(query, limit);
  },

  getActionItemsForMeeting(meetingId: string): ActionItem[] {
    logger.info('db.get_action_items', { meetingId });
    return getActionItemsForMeeting(meetingId);
  },

  getRecentActionItems(limit = 20) {
    logger.info('db.get_recent_action_items', { limit });
    return getRecentActionItems(limit);
  },
};