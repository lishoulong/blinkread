import React from "react";
import { List, message } from 'antd';

const extractAllText = () => {
  const paragraphNodes = document.querySelectorAll("p");
  const textList = Array.from(paragraphNodes).map(
    (p) => p.innerText
  );
  
  const MAX_TOKENS = 50;
  const splitTextList = [];
  let currentText = "";
  let currentTokens = 0;
  
  for (let i = 0; i < textList.length; i++) {
    const paragraph = textList[i];
    const tokens = paragraph.split(/\s+/).length;
    
    if (currentTokens + tokens <= MAX_TOKENS) {
      currentText += paragraph + ", ";
      currentTokens += tokens;
    } else {
      splitTextList.push(currentText.trim());
      currentText = paragraph + " ";
      currentTokens = tokens;
    }
  }
  
  if (currentText.trim() !== "") {
    splitTextList.push(currentText.trim());
  }
  console.log('splitTextList length', splitTextList.length)
  return splitTextList;
};



const getUrl = () => {
  const url = window.location.href;
  return url;
};

interface QaItem {
  question: string;
  answer: string;
}
interface QaProps {
  answers: QaItem[];
}
const Qa: React.FC<QaProps> = ({answers}) => (
  <List
    itemLayout="horizontal"
    dataSource={answers}
    header="问题以及答案"
    style={{height: "300px", width: "95%", overflow: "auto", paddingBottom: "10px"}}
    renderItem={(item: QaItem, index: number) => (
      <List.Item>
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", flexDirection: "row"}}>
            <button style={{width: '60px'}}>Question</button>
            <div style={{flex: 1, border: "1px solid #070b0a1c",}}>{item.question}</div>
          </div>
          <div style={{display: "flex", flexDirection: "row"}}>
            <button style={{width: '60px'}}>Answer</button>
            <div style={{display: 'flex', alignItems: 'center', flex: 1, height: '120px', overflow: 'scroll', border: "1px solid #070b0a1c",}}>{item.answer}</div>
          </div>
        </div>
      </List.Item>
    )}
  />
);
function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = React.useState(true);
  const [questionLoading, setQuestionLoading] = React.useState(false);
  const [answers, setAnswers] = React.useState<QaItem[]>([]);
  const [summarize, setSummarize] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const unmountApp = () => {
    document.getElementById("blinkread-root")?.remove();
    location.reload();
  };

  const shareUrl = () => {
    // 获取到页面的 url
    const urls = getUrl();
    console.log('shareUrl summarize', summarize)
    chrome.runtime.sendMessage(
      { type: "share", content: summarize, url: urls },
      function (response) {
        console.log('share response', response);
        messageApi.info('页面成功分享到飞书');
      }
    )
  };

  const clickHandler = () => {
    const question = inputRef.current?.value.trim() ?? "";
    if (question.length) {
      setQuestionLoading(true);
      const urls = getUrl();
      chrome.runtime.sendMessage(
        { type: "summarize", question: [question], url: urls },
        function (response) {
          setQuestionLoading(false);
          setAnswers((prevAnswers) => [{
            question,
            answer: response.text.result
          }, ...prevAnswers]);
        }
      );
    }
  }

  React.useEffect(() => {
    const allText = extractAllText();
    const urls = getUrl();
    chrome.runtime.sendMessage(
      { type: "summarize", url: urls, content: allText },
      function (response) {
        setLoading(false);
        console.log('response.text.result', response.text.result)
        setSummarize(response.text.result);
      }
    );
  }, []);
  const fixedElementHeight = "5rem"; 
  return (
    <div className="w-[500px] min-h-[100px] max-h-[500px] p-4 text-slate-900 text-base flex flex-col relative" style={{
      maxHeight: `calc(500px + ${fixedElementHeight})`,
      paddingBottom: fixedElementHeight,
    }}>
      <div className="flex items-center mb-2 gap-x-1">
        <h1 className="font-black text-sm">AIReadSite</h1>
        <span className="text-xs">Powered by OpenAI GPT-3.5</span>
      </div>
      <div
        className="w-[12px] absolute top-4 right-4 cursor-pointer"
        onClick={unmountApp}
      >
        <img src={chrome.runtime.getURL("close.png")} width="100%" />
      </div>
      {contextHolder}
      <div
        className="top-4 w-[12px] absolute cursor-pointer"
        style={{right: "6rem"}}
        onClick={shareUrl}
      >
        <img src={chrome.runtime.getURL("share.png")} width="100%" />
      </div>
      
      {loading ? (
        <div className="flex flex-col w-full justify-center items-center gap-y-2">
          <div className="w-[100px]">
            <img src={chrome.runtime.getURL("loading.gif")} width="100%" />
          </div>
          <p>Processing the content...</p>
        </div>
      ) : (
        <div>
          <h3>文章总结</h3>
          <div
            style={{
              width: '95%',
              height: '200px',
              border: '1px solid #070b0a1c',
              overflowY: 'scroll',
            }}
            dangerouslySetInnerHTML={{ __html: summarize }} // 使用此属性设置HTML
          ></div>
        </div>
      )}
      {questionLoading ? (
        <div className="flex flex-col w-full justify-center items-center gap-y-2">
          <div className="w-[100px]">
            <img src={chrome.runtime.getURL("loading.gif")} width="100%" />
          </div>
          <p>Answering the question...</p>
        </div>
      ) : (
        <Qa answers={answers}/>
      )}
      <div style={{ position: "fixed", display: "flex", alignItems: "center", bottom: "1rem", left: "1rem", width: "calc(100% - 2rem)", maxWidth: "600px" }}>
        <input
          ref={inputRef} // 将 inputRef 引用赋值给 input 的 ref
          style={{ flex: 2, border: "2px solid #ccc", borderRadius: "4px", padding: "0.5rem" }}
        />
        <span style={{ marginRight: "1rem", border: "1px solid", padding: "0.5rem", background: "#7070aa", color: "white" }} onClick={clickHandler}>开始提问</span>
	    </div>
    </div>
  );
}

export default App;