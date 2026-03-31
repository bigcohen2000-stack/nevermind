import { readAntispamFromForm, stampFormStartTime, validateAntispamFields } from "../lib/form-antispam";

declare global {
  interface Window {
    __nmReadAntispamFromForm?: typeof readAntispamFromForm;
    __nmValidateAntispamFields?: typeof validateAntispamFields;
    __nmStampFormAntispam?: typeof stampFormStartTime;
  }
}

window.__nmReadAntispamFromForm = readAntispamFromForm;
window.__nmValidateAntispamFields = validateAntispamFields;
window.__nmStampFormAntispam = stampFormStartTime;
