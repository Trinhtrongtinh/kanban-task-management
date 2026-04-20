"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberStatus = exports.BoardRole = exports.WorkspaceRole = void 0;
var WorkspaceRole;
(function (WorkspaceRole) {
    WorkspaceRole["OWNER"] = "OWNER";
    WorkspaceRole["ADMIN"] = "ADMIN";
    WorkspaceRole["MEMBER"] = "MEMBER";
    WorkspaceRole["OBSERVER"] = "OBSERVER";
})(WorkspaceRole || (exports.WorkspaceRole = WorkspaceRole = {}));
var BoardRole;
(function (BoardRole) {
    BoardRole["ADMIN"] = "ADMIN";
    BoardRole["EDITOR"] = "EDITOR";
    BoardRole["VIEWER"] = "VIEWER";
})(BoardRole || (exports.BoardRole = BoardRole = {}));
var MemberStatus;
(function (MemberStatus) {
    MemberStatus["PENDING"] = "PENDING";
    MemberStatus["ACTIVE"] = "ACTIVE";
})(MemberStatus || (exports.MemberStatus = MemberStatus = {}));
//# sourceMappingURL=role.enum.js.map