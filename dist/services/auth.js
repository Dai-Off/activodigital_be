"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRequest = loginRequest;
exports.signupRequest = signupRequest;
exports.fetchMe = fetchMe;
exports.validateInvitation = validateInvitation;
exports.signupWithInvitation = signupWithInvitation;
const api_1 = require("./api");
async function loginRequest(payload) {
    return (0, api_1.apiFetch)('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
async function signupRequest(payload) {
    return (0, api_1.apiFetch)('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
async function fetchMe() {
    return (0, api_1.apiFetch)('/auth/me', { method: 'GET' });
}
// Validar token de invitación
async function validateInvitation(token) {
    return (0, api_1.apiFetch)(`/auth/validate-invitation?token=${encodeURIComponent(token)}`, { method: 'GET' });
}
// Registro con invitación
async function signupWithInvitation(payload) {
    return (0, api_1.apiFetch)('/auth/register-with-invitation', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
//# sourceMappingURL=auth.js.map