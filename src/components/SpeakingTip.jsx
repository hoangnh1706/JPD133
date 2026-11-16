import { Lightbulb } from 'lucide-react';
import { getReadingTip, getSpeakingTip } from '../utils/speakingTips';

export default function SpeakingTip({ grammar, question, reading = false, exam = false }) {
  const { focus, action, pattern } = reading ? getReadingTip(question) : getSpeakingTip({ grammar, question });
  return <details className="speaking-tip" key={`${reading ? 'reading' : 'speaking'}-${question}`} open={!exam}>
    <summary><Lightbulb size={18}/><span>Mẹo trả lời</span><small>{focus}</small></summary>
    <div className="speaking-tip-body"><p>{action}</p><div className="speaking-tip-pattern"><span>KHUNG CÂU</span><strong lang="ja">{pattern}</strong></div><p className="speaking-tip-note">Thay phần trong ngoặc vuông bằng thông tin phù hợp trước khi xem câu tham khảo.</p></div>
  </details>;
}
