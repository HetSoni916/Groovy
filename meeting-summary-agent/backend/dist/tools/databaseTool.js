"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseTool = void 0;
const meetingModel_1 = require("../database/meetingModel");
const logger_1 = require("../utils/logger");
exports.databaseTool = {
    saveMeeting(analysis, transcript, meetingDateTime, status) {
        logger_1.logger.info('db.save_meeting.start', { title: analysis.title });
        const meeting = (0, meetingModel_1.insertMeeting)(analysis, transcript, meetingDateTime, status);
        logger_1.logger.info('db.save_meeting.success', { meetingId: meeting.id, actionItems: meeting.actionItems.length });
        return meeting;
    },
    getMeetingById(id) {
        logger_1.logger.info('db.get_meeting', { meetingId: id });
        return (0, meetingModel_1.getMeetingById)(id);
    },
    listMeetings(limit = 20) {
        logger_1.logger.info('db.list_meetings', { limit });
        return (0, meetingModel_1.listMeetings)(limit);
    },
    searchMeetings(query, limit = 10) {
        logger_1.logger.info('db.search_meetings', { query, limit });
        return (0, meetingModel_1.searchMeetings)(query, limit);
    },
    getActionItemsForMeeting(meetingId) {
        logger_1.logger.info('db.get_action_items', { meetingId });
        return (0, meetingModel_1.getActionItemsForMeeting)(meetingId);
    },
    getRecentActionItems(limit = 20) {
        logger_1.logger.info('db.get_recent_action_items', { limit });
        return (0, meetingModel_1.getRecentActionItems)(limit);
    },
};
//# sourceMappingURL=databaseTool.js.map