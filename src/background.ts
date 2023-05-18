// @ts-ignore
import mount from "./content?script";

const API_ENDPOINT_SUMMARIZE = "http://10.0.86.219:80/api-summarize";
const API_ENDPOINT_SHARE = "http://10.0.86.219:80/api-share";
// const API_ENDPOINT_SUMMARIZE = "http://localhost:80/api-summarize";
// const API_ENDPOINT_SHARE = "http://localhost:80/api-share";

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    files: [mount],
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("request.content", request);
  const { type, question, url, content } = request;
  if (type === "summarize") {
    const data = {
      urls: [url],
      question,
      content,
    };
    fetch(API_ENDPOINT_SUMMARIZE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json()) // Return JSON response instead of text
      .then((res) => {
        console.log("API_ENDPOINT_SUMMARIZE res", res);
        sendResponse({ text: res });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ error: err.message });
      });
  } else if (type === "share") {
    const data = {
      urls: url,
      content,
    };
    fetch(API_ENDPOINT_SHARE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json()) // Return JSON response instead of text
      .then((res) => {
        console.log("API_ENDPOINT_SHARE res", res);
        sendResponse({ text: res });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ error: err.message });
      });
  }
  return true;
});
