import { create } from "zustand";

export type RecipientSource = "list" | "csv" | "manual";

export interface ComposeState {
  step: number;
  categoryId: string;
  templateId: string;
  recipientSource: RecipientSource;
  recipientListId: string;
  manualEmails: string[];
  csvFileAssetId: string | null;
  variableMapping: Record<string, string>;
  signatureId: string;
  campaignName: string;
  testEmail: string;

  setStep: (step: number) => void;
  setCategoryId: (id: string) => void;
  setTemplateId: (id: string) => void;
  setRecipientSource: (source: RecipientSource) => void;
  setRecipientListId: (id: string) => void;
  setManualEmails: (emails: string[]) => void;
  setCsvFileAssetId: (id: string | null) => void;
  setVariableMapping: (mapping: Record<string, string>) => void;
  setSignatureId: (id: string) => void;
  setCampaignName: (name: string) => void;
  setTestEmail: (email: string) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  categoryId: "",
  templateId: "",
  recipientSource: "list" as RecipientSource,
  recipientListId: "",
  manualEmails: [] as string[],
  csvFileAssetId: null as string | null,
  variableMapping: {} as Record<string, string>,
  signatureId: "",
  campaignName: "",
  testEmail: "",
};

export const useComposeStore = create<ComposeState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setCategoryId: (categoryId) => set({ categoryId, templateId: "" }),
  setTemplateId: (templateId) => set({ templateId }),
  setRecipientSource: (recipientSource) => set({ recipientSource }),
  setRecipientListId: (recipientListId) => set({ recipientListId }),
  setManualEmails: (manualEmails) => set({ manualEmails }),
  setCsvFileAssetId: (csvFileAssetId) => set({ csvFileAssetId }),
  setVariableMapping: (variableMapping) => set({ variableMapping }),
  setSignatureId: (signatureId) => set({ signatureId }),
  setCampaignName: (campaignName) => set({ campaignName }),
  setTestEmail: (testEmail) => set({ testEmail }),
  reset: () => set(initialState),
}));
