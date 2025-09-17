"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionType = exports.BookStatus = exports.BookSource = void 0;
var BookSource;
(function (BookSource) {
    BookSource["MANUAL"] = "manual";
    BookSource["PDF"] = "pdf";
})(BookSource || (exports.BookSource = BookSource = {}));
var BookStatus;
(function (BookStatus) {
    BookStatus["DRAFT"] = "draft";
    BookStatus["IN_PROGRESS"] = "in_progress";
    BookStatus["COMPLETE"] = "complete";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var SectionType;
(function (SectionType) {
    SectionType["GENERAL_DATA"] = "general_data";
    SectionType["CONSTRUCTION_FEATURES"] = "construction_features";
    SectionType["CERTIFICATES_AND_LICENSES"] = "certificates_and_licenses";
    SectionType["MAINTENANCE_AND_CONSERVATION"] = "maintenance_and_conservation";
    SectionType["FACILITIES_AND_CONSUMPTION"] = "facilities_and_consumption";
    SectionType["RENOVATIONS_AND_REHABILITATIONS"] = "renovations_and_rehabilitations";
    SectionType["SUSTAINABILITY_AND_ESG"] = "sustainability_and_esg";
    SectionType["ANNEX_DOCUMENTS"] = "annex_documents";
})(SectionType || (exports.SectionType = SectionType = {}));
//# sourceMappingURL=libroDigital.js.map