// @ts-ignore
import mount from "./content?script";
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    files: [mount],
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  fetch("http://localhost:3000/summary", {
    method: "POST",
    body: request.content,
  })
    .then((res) => {
      return res.text();
    })
    .then((res) => sendResponse({ text: res }));

  return true;
});
