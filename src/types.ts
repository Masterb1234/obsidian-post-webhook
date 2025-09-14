export interface WebhookSettings {
  webhooks: Webhook[];
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  excludeAttachments?: boolean;
  includeVariableNote?: boolean;
  enabled?: boolean;
  processInlineFields?: boolean;
  responseHandling: ResponseHandlingMode;
  headers?: string;
  timeout?: number;
  sendRenderedHtml?: boolean;
  convertInternalLinksToObsidianURIs?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  mimeType: string;
  size: number;
  data: string;
  path: string;
}

export interface WebhookPayload {
  content: string;
  filename: string;
  filepath: string;
  timestamp: number;
  createdAt: number;
  modifiedAt: number;
  attachments: Attachment[];
  renderedHtml?: string;
  [key: string]: any;
}

export interface WebhookResponse {
  status: number;
  text: string;
}

export interface VariableNote {
  title: string;
  path: string;
  variables: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
}

export interface IVariableNoteModal {
  onSubmit: (note: VariableNote | null) => void;
  onCancel: () => void;
  open: () => void;
  close: () => void;
}

export type ResponseHandlingMode = 'append' | 'new' | 'overwrite' | 'none' | 'ask';