let defaultMaxTime = 300;
let intervalId;

//handle message from popup.js and set the time to defaultMaxTime
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.time) {
    defaultMaxTime = message.time;
    localStorage.setItem("defaultMaxTime", defaultMaxTime);
    if (!intervalId) {
      const timeElem = document.getElementById("timeElem");
      timeElem.textContent = getFormattedTime(defaultMaxTime);
    }
  }
});

const getFormattedTime = (time) => {
  let min = Math.floor(time / 60);
  let sec = Math.floor(time % 60);
  if (min < 10) min = `0${min}`;
  if (sec < 10) sec = `0${sec}`;
  return `${min}:${sec}`;
};
const getId = () => {
  //problem may be opened from contest/Problemset, so two diff handlers
  //Id of the question, returns like (1852/A)
  const currentURL = window.location.toString();
  const len = currentURL.length;
  if (currentURL.includes("contest")) {
    id = "";
    for (let i = 31; i < len; i++) {
      if (currentURL.charAt(i) == "/") {
        id += "/";
        id += currentURL.charAt(i + 9);
        break;
      }
      id += currentURL.charAt(i);
    }
    console.log(id);
    return id;
  } else {
    let id = "";
    for (let i = 42; i < len; i++) {
      if (currentURL.charAt(i) == "/") {
        id += "/";
        id += currentURL.charAt(i + 1);
        break;
      }
      id += currentURL.charAt(i);
    }
    console.log(id);
    return id;
  }
};

const updateTimerDisplay = (timeLeft) => {
  const timeElem = document.getElementById("timeElem");
  timeElem.textContent = getFormattedTime(timeLeft);
};

const getSubmissionsCount = () => {
  const tableRows = document.querySelector(".rtable.smaller tbody");
  if (!tableRows) return 0;
  const count = tableRows.querySelectorAll("tr").length - 1;
  return count;
};

const addSubmitTimeAndSubmissionsCount = () => {
  //when start button is clicked and timer is running, if submit button is clicked add id-{submissontime,submissioncount} to local storage
  const currentTime = new Date();
  const currTime = currentTime.getTime() / 1000;
  const id = getId();
  const attributesInStorage = JSON.parse(localStorage.getItem(id));
  attributesInStorage.submission_Time = currTime;
  attributesInStorage.submissoins_Count = getSubmissionsCount();
  localStorage.setItem(id, JSON.stringify(attributesInStorage));
};
const activateSubmitButtonandStore = () => {
  const submiBtn = document.getElementById("sidebarSubmitButton");
  submiBtn.addEventListener("click", addSubmitTimeAndSubmissionsCount);
};

const deactivateSubmitButton = () => {
  const submiBtn = document.getElementById("sidebarSubmitButton");
  submiBtn.removeEventListener("click", addSubmitTimeAndSubmissionsCount);
};

const startTimer = (time) => {
  const timeElem = document.getElementById("timeElem");
  if (timeElem.textContent.includes("Time")) return; //If timer is displaying Time OUt/Time Taken then start should not be active
  if (intervalId) return; //Start button inactive if interval is running

  const currentTime = new Date();
  const startTime = currentTime.getTime() / 1000;
  const id = getId();

  const attributesInStorage = localStorage.getItem(id);
  if (!attributesInStorage) {
    const attributes = {
      max_Time: time,
      start_Time: startTime,
    };
    localStorage.setItem(id, JSON.stringify(attributes));
  }
  activateSubmitButtonandStore();

  timeLeft = time;

  intervalId = setInterval(function () {
    timeLeft--;
    if (timeLeft < 0) {
      const timeElem = document.getElementById("timeElem");
      timeElem.textContent = "Time Out";
      clearInterval(intervalId);
      deactivateSubmitButton(); //deactivate the submit button
      localStorage.removeItem(id);
    } else {
      updateTimerDisplay(timeLeft);
    }
  }, 1000);
};

const resetTimer = () => {
  clearInterval(intervalId);
  intervalId = undefined; //don't know why clearInterval is not working

  const id = getId();
  localStorage.removeItem(id);
  const timeElem = document.getElementById("timeElem");
  timeElem.textContent = getFormattedTime(defaultMaxTime);
  timeElem.style.fontSize = "30px"; //take care of font size
  deactivateSubmitButton();
};

const addContent = () => {
  const timer = document.createElement("div");
  timer.id = "timer";

  const timeElem = document.createElement("div");
  timeElem.id = "timeElem";
  id = getId();
  const attributes = JSON.parse(localStorage.getItem(id));
  if (attributes) timeElem.textContent = ""; //added based on attributes
  else {
    const defaultMaxTimeInStorage = localStorage.getItem("defaultMaxTime");
    if (defaultMaxTimeInStorage)
      timeElem.textContent = getFormattedTime(defaultMaxTimeInStorage);
    else timeElem.textContent = getFormattedTime(defaultMaxTime);
  }

  const mybuttons = document.createElement("div");
  mybuttons.id = "mybuttons";

  const start = document.createElement("button");
  start.textContent = "Start";
  start.id = "start";
  start.addEventListener("click", () => {
    startTimer(defaultMaxTime);
  });

  const reset = document.createElement("button");
  reset.textContent = "Reset";
  reset.id = "reset";
  reset.addEventListener("click", resetTimer);

  mybuttons.appendChild(start);
  mybuttons.appendChild(reset);
  timer.appendChild(timeElem);
  timer.appendChild(mybuttons);

  const sideBar = document.querySelector("#sidebar");
  if (sideBar) {
    sideBar.prepend(timer);
  }
};

const checkIfTimerRunning = (attributes) => {
  const date = new Date();
  const currTime = date.getTime() / 1000;
  let remTime = attributes.max_Time - (currTime - attributes.start_Time);
  if (remTime <= 0) {
    const id = getId();
    localStorage.removeItem(id);
    const timeElem = document.getElementById("timeElem");
    timeElem.textContent = "Time Out";
    return false;
  } else {
    return true;
  }
};

const getRecentVerdict = () => {
  //returns recent verdict
  const tableRows = document.querySelector(".rtable.smaller tbody");
  const recentSubmission = tableRows
    .querySelector("tr:nth-child(2) td:nth-child(3)")
    .textContent.trim();
  if (recentSubmission == "Accepted") return true;
  return false;
};
const recoverFromLocalStorage = () => {
  let defaultMaxTimeInStorage = localStorage.getItem("defaultMaxTime"); //If there is default time stored, then retrive it.
  if (defaultMaxTimeInStorage) defaultMaxTime = defaultMaxTimeInStorage;

  let id = getId();
  let attributes = localStorage.getItem(id);

  if (!attributes) {
    //If no attributes
    const alreadySolved = localStorage.getItem(`TimeTaken_${id}`); //Check if already solved
    console.log(alreadySolved);
    if (alreadySolved) {
      //If solved show the time taken
      const timeElem = document.getElementById("timeElem");
      timeElem.textContent = "Time Taken:";
      timeElem.textContent += getFormattedTime(alreadySolved);
      timeElem.style.fontSize = "25px";
    }
    return;
  }
  attributes = JSON.parse(attributes);
  if (
    attributes.submission_Time &&
    attributes.submissoins_Count + 1 == getSubmissionsCount() //Check if submissons increased (There may be a case where a slon is submitted but may be same file, then it won't run)
  ) {
    const verdict = getRecentVerdict();
    console.log("verdit", verdict);
    if (verdict) {
      //If solved show time taken and store it in local storage
      const timeElem = document.getElementById("timeElem");
      timeElem.textContent = "Time Taken:";
      timeElem.textContent += getFormattedTime(
        attributes.submission_Time - attributes.start_Time
      );
      localStorage.setItem(
        `TimeTaken_${id}`,
        attributes.submission_Time - attributes.start_Time
      );
      localStorage.removeItem(id);
      return;
    } else {
      delete attributes["submission_Time"]; //since it is not AC remove submission_time and submission_count
      delete attributes["submissoins_Count"];
      localStorage.setItem(id, JSON.stringify(attributes));
    }
  }
  if (
    attributes.submission_Time &&
    attributes.submissoins_Count == getSubmissionsCount()
  ) {
    delete attributes["submission_Time"]; //since submission count not increased delete
    delete attributes["submissoins_Count"];
    localStorage.setItem(id, JSON.stringify(attributes));
  }
  const isTimerRunning = checkIfTimerRunning(attributes); //take cares of Time Out also
  if (!isTimerRunning) {
    return;
  }

  const date = new Date(); //If timer is running continue with
  const currTime = date.getTime() / 1000;
  startTimer(attributes.max_Time - (currTime - attributes.start_Time));
};

const checkIfContestRunning = () => {
  const sideTableLength = document
    .querySelector(".rtable tbody")
    .querySelectorAll("tr").length;
  if (sideTableLength == 5) return true;
  return false;
};

const insertTimer = () => {
  window.addEventListener("load", () => {
    const currentURL = window.location.toString(); //different URL for contest ques and problemset ques, So needed to handeled.
    if (currentURL.includes("contest")) {
      if (currentURL.includes("problem")) {
        const checkContestRunning = checkIfContestRunning(); //checking if there is a contest running
        if (!checkContestRunning) {
          addContent();
          recoverFromLocalStorage();
        }
      }
    } else {
      addContent();
      recoverFromLocalStorage();
      console.log(getSubmissionsCount());
    }
  });
};

insertTimer();
