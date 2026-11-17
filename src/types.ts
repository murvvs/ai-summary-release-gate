export interface Message { id: string; text: string }
export interface Ticket { id: string; subject: string; messages: Message[] }

export type ServiceBody =
  | { status: 'ok'; summary: string; sourceIds?: string[] }
  | { status: 'insufficient_information' }
  | { error: string };

export interface Verdict { eligible: boolean; reasons: string[] }
