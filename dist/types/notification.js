"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStatus = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    NotificationType["AI_PROCESSING_START"] = "ai_processing_start";
    NotificationType["AI_PROCESSING_PROGRESS"] = "ai_processing_progress";
    NotificationType["AI_PROCESSING_COMPLETE"] = "ai_processing_complete";
    NotificationType["AI_PROCESSING_ERROR"] = "ai_processing_error";
    NotificationType["BOOK_CREATED"] = "book_created";
    NotificationType["BOOK_UPDATED"] = "book_updated";
    NotificationType["GENERAL"] = "general";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["UNREAD"] = "unread";
    NotificationStatus["READ"] = "read";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
//# sourceMappingURL=notification.js.map