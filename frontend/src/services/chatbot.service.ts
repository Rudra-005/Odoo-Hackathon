import api from '../config/axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  const response = await api.post('/chatbot/chat/', { message, history });
  // axios interceptor may unwrap StandardJSONRenderer {success, data} — handle both shapes
  const data = response.data;
  return data?.reply ?? data?.data?.reply ?? data;
};
