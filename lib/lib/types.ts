import { StoryType } from "./prompts";

export interface HearthifyRequest {
  originalText: string;
  storyType: StoryType;
  contextNotes?: string;
  metadata?: string;
}

export interface HearthifyResponse {
  generatedText: string;
  storyType: StoryType;
}
