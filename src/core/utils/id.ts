// ID generation utilities

export const createId = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

export const createNoteId = (topic: string, subtopic?: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const cleanSubtopic = subtopic?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  return cleanSubtopic ? `${timestamp}-${cleanTopic}-${cleanSubtopic}` : `${timestamp}-${cleanTopic}`;
};

export const createSessionId = (topic: string): string => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  const random = Math.random().toString(36).substring(2, 6);
  return `session-${timestamp}-${cleanTopic}-${random}`;
};

export const parseNoteId = (noteId: string): { timestamp: string; topic: string; subtopic?: string } => {
  const parts = noteId.split('-');
  const timestamp = parts.slice(0, 2).join('-');
  const topic = parts[2] ?? '';
  const subtopic = parts[3];
  
  const result: { timestamp: string; topic: string; subtopic?: string } = { 
    timestamp, 
    topic 
  };
  
  if (subtopic) {
    result.subtopic = subtopic;
  }
  
  return result;
};