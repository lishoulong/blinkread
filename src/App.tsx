import React, { KeyboardEvent } from "react";
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
    className="text-base h-[300px] w-[95%] overflow-auto pb-2.5"
    renderItem={(item: QaItem, index: number) => (
      <List.Item>
        <div className="flex flex-col">
          <div className="flex flex-row">
            <button className="w-[60px]">Question</button>
            <div className="flex-1 border border-solid border-opacity-10">{item.question}</div>
          </div>
          <div className="flex flex-row">
            <button className="w-[60px]">Answer</button>
            <div className="items-center flex-1 h-[120px] overflow-scroll border border-solid border-opacity-10">{item.answer}</div>
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
    if (inputRef.current) {
      inputRef.current.value = ""; // 清空输入框
    }
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.code === "Enter") {
      clickHandler();
    }
  };

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
          <h3 className="font-semibold">文章总结</h3>
          <div
            className="w-[95%] h-[200px] border border-solid border-opacity-10 overflow-y-scroll text-[13px]"
            dangerouslySetInnerHTML={{ __html: summarize }}
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
      <div className="fixed bottom-[1rem] left-[1rem] w-[calc(100%-2rem)] max-w-[600px] flex items-center">
          <div className="flex-1">
            <input
              ref={inputRef}
              className="w-full border-2 border-grey-300 rounded pl-2 pr-2 py-1"
              onKeyDown={handleKeyPress}
            />
          </div>
          <div className="w-[90px] ml-4">
            <span className="w-full p-2 bg-blue-400 text-white cursor-pointer" onClick={clickHandler}>开始提问</span>
          </div>
      </div>
    </div>
  );
}

export default App;