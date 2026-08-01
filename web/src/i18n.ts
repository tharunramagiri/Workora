// i18n bootstrap (react-i18next). Default English, switchable to Chinese; choice persisted in localStorage "Workora.lang".
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
// English only (Chinese locale removed in the Workora fork)

const saved = (typeof localStorage !== "undefined" && localStorage.getItem("Workora.lang")) || "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: saved,
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
