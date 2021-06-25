/*
 *
 *  ID: 1750655
 * Author: Jiajie Li
 *
 * Description: The mobile version of TodoMVC, the final project
 * of scripting program design in the School of Software Engineering
 * of Tongji University
 *
 */

$ = function (id) {
  return document.getElementById(id);
};

$$ = function (cls) {
  return document.getElementsByClassName(cls);
};

tasks_todo = [];
tasks_displayed = [];
curID = 0;

window.onload = function () {
  if (localStorage.getItem("tasks") != null) {
    tasks_todo = JSON.parse(localStorage.getItem("tasks"));
    for (var i = 0; i < tasks_todo.length; i++) {
      if (tasks_todo[i].id > curID) {
        curID = tasks_todo[i].id;
      }
    }
  }
  console.log(tasks_todo);
  initRNN();
  initAddButton();
  initModal();
  initBulkOp();
  initEmail();
  initHand();
  render();
};

function updateActive(tasks_displayed) {
  var activeDiv = $("activeDiv");
  todoCount = 0;
  totalCount = tasks_displayed.length;
  for (var i = 0; i < totalCount; i++)
    if (tasks_displayed[i].status == "To-Do") todoCount += 1;
  activeDiv.innerHTML =
    totalCount + " items in total, " + todoCount + " items todo";
}

function removeTask(id) {
  for (var i = 0; i < tasks_todo.length; i++)
    if (tasks_todo[i].id == id) {
      tasks_todo.splice(i, 1);
      break;
    }
  render();
}

function shiftTaskStatus(id) {
  for (var i = 0; i < tasks_todo.length; i++)
    if (tasks_todo[i].id == id) {
      if (tasks_todo[i].status == "To-Do") tasks_todo[i].status = "Completed";
      else tasks_todo[i].status = "To-Do";
      break;
    }
  render();
}

function getHandPose(landmarks) {
  sum_thumb =
    getAngleFromLandmark(landmarks, 0, 1, 2) +
    getAngleFromLandmark(landmarks, 1, 2, 3) +
    getAngleFromLandmark(landmarks, 2, 3, 4);
  sum_index =
    getAngleFromLandmark(landmarks, 0, 5, 6) +
    getAngleFromLandmark(landmarks, 5, 6, 7) +
    getAngleFromLandmark(landmarks, 6, 7, 8);
  sum_middle =
    getAngleFromLandmark(landmarks, 0, 9, 10) +
    getAngleFromLandmark(landmarks, 9, 10, 11) +
    getAngleFromLandmark(landmarks, 10, 11, 12);
  sum_ring =
    getAngleFromLandmark(landmarks, 0, 13, 14) +
    getAngleFromLandmark(landmarks, 13, 14, 15) +
    getAngleFromLandmark(landmarks, 14, 15, 16);
  sum_pinky =
    getAngleFromLandmark(landmarks, 0, 17, 18) +
    getAngleFromLandmark(landmarks, 17, 18, 19) +
    getAngleFromLandmark(landmarks, 18, 19, 20);

  let finger_cull = [];
  if (sum_thumb > 1.1) finger_cull.push("thumb");
  if (sum_index > 1) finger_cull.push("index");
  if (sum_middle > 1) finger_cull.push("middle");
  if (sum_ring > 1) finger_cull.push("ring");
  if (sum_pinky > 1) finger_cull.push("pinky");

  let speed = 0;
  if (
    finger_cull.toString() ===
    ["thumb", "index", "middle", "ring", "pinky"].toString()
  )
    speed = 0;
  if (
    finger_cull.toString() ===
      ["thumb", "middle", "ring", "pinky"].toString() ||
    finger_cull === ["middle", "ring", "pinky"].toString()
  )
    speed = 0.2;
  if (
    finger_cull.toString() === ["thumb", "ring", "pinky"].toString() ||
    finger_cull === ["ring", "pinky"].toString()
  )
    speed = 0.4;
  if (
    finger_cull.toString() === ["thumb", "index"].toString() ||
    finger_cull === ["index"].toString()
  )
    speed = 0.6;
  if (finger_cull.toString() === ["thumb"].toString()) speed = 0.8;
  if (finger_cull.toString() === [].toString()) speed = 1;

  direction = getDirection(landmarks, 5, 8);

  return [speed, direction];
}

function getDirection(landmarks, id_1, id_2, thre = 3) {
  x = landmarks[id_2].x - landmarks[id_1].x;
  y = landmarks[id_2].y - landmarks[id_1].y;
  z = landmarks[id_2].z - landmarks[id_1].z;
  console.log(x, y);
  if (!(Math.abs(x / y) > thre || Math.abs(x / y) < 1 / thre)) return "";
  if (Math.abs(x / y) > thre && x > 0) return "Left";
  if (Math.abs(x / y) > thre && x < 0) return "Right";
  if (Math.abs(x / y) < 1 / thre && y > 0) return "Backward";
  if (Math.abs(x / y) < 1 / thre && y < 0) return "Forward";
}

function getAngleFromLandmark(landmarks, id_1, id_2, id_3) {
  x1 = landmarks[id_2].x - landmarks[id_1].x;
  y1 = landmarks[id_2].y - landmarks[id_1].y;
  z1 = landmarks[id_2].z - landmarks[id_1].z;

  x2 = landmarks[id_3].x - landmarks[id_2].x;
  y2 = landmarks[id_3].y - landmarks[id_2].y;
  z2 = landmarks[id_3].z - landmarks[id_2].z;

  return getAngle(x1, y1, z1, x2, y2, z2);
}

function getAngle(x1, y1, z1, x2, y2, z2) {
  ab = x1 * x2 + y1 * y2 + z1 * z2;
  a_mod = Math.sqrt(x1 ** 2 + y1 ** 2 + z1 ** 2);
  b_mod = Math.sqrt(x2 ** 2 + y2 ** 2 + z2 ** 2);
  cos = ab / (a_mod * b_mod);
  return Math.acos(cos);
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  var pose;
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      // console.log(landmarks);
      console.log(getHandPose(landmarks));
      pose = getHandPose(landmarks)[0];
      if (pose == "" && getHandPose(landmarks)[1] == 0) pose = "Stop";
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
    }
    if (pose == 0.2) complete_all();
    if (pose == 0.4) todo_all();
    if (pose == 0.6) clear_all();
  }
  canvasCtx.restore();
}

initRNN = function () {
  rnn = ml5.charRNN("../model/bolano/", modelLoaded);

  // When the model is loaded
  function modelLoaded() {
    console.log("Model Loaded!");
  }

  // Generate content
  rnn.generate({ seed: "the meaning of pizza is" }, (err, results) => {
    console.log("results:", results);
  });
};

initHand = function () {
  videoElement = $$("input_video")[0];
  canvasElement = $$("output_canvas")[0];
  canvasCtx = canvasElement.getContext("2d");

  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });
  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.85,
    minTrackingConfidence: 0.5,
  });
  hands.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
  });
  camera.start();
};

initBulkOp = function () {
  $("bundle_op_2").style.display = "none";
  clear_all = function () {
    temp_todo_list = [];
    for (var i = 0; i < tasks_todo.length; i++)
      if (tasks_todo[i].status != "Completed")
        temp_todo_list.push(tasks_todo[i]);
    tasks_todo = temp_todo_list;
    console.log(tasks_todo);
    render();
  };
  $("clear-all").addEventListener("touchend", clear_all);

  todo_all = function () {
    for (var i = 0; i < tasks_todo.length; i++) tasks_todo[i].status = "To-Do";
    console.log(tasks_todo);
    render();
  };
  $("todo-all").addEventListener("touchend", todo_all);

  complete_all = function () {
    for (var i = 0; i < tasks_todo.length; i++)
      tasks_todo[i].status = "Completed";
    console.log(tasks_todo);
    render();
  };
  $("complete-all").addEventListener("touchend", complete_all);

  var pri_dict = { High: 3, Med: 2, Low: 1 };
  $("sort").addEventListener("touchend", function () {
    sorted = true;
    for (var i = 1; i < tasks_todo.length; i++)
      if (
        pri_dict[tasks_todo[i].order] - pri_dict[tasks_todo[i - 1].order] <
        0
      ) {
        sorted = false;
        break;
      }
    if (!sorted)
      tasks_todo.sort(function (a, b) {
        return pri_dict[a.order] - pri_dict[b.order];
      });
    else
      tasks_todo.sort(function (a, b) {
        return -pri_dict[a.order] + pri_dict[b.order];
      });
    render();
  });
};

initAddButton = function () {
  var addButton = $("addButton");
  $("todoInput").addEventListener("keyup", function () {
    // console.log($("todoInput").value);
    rnn.generate({ seed: $("todoInput").value }, (err, results) => {
      console.log("results:", results);
      $('bundle_op_2').innerHTML = $("todoInput").value + results['sample']
    });
  });

  $("todoInput").addEventListener("focusin", function () {
    $("bundle_op_1").style.display = "none";
    $("bundle_op_2").style.display = "block";
  });

  $("todoInput").addEventListener("focusout", function () {
    $("bundle_op_1").style.display = "block";
    $("bundle_op_2").style.display = "none";
  });

  addButton.addEventListener("touchend", function () {
    if ($("todoInput").value == "") {
      alert("Title can't be empty！");
    } else {
      var task = {};
      curID += 1;
      task.title = $("todoInput").value;
      task.id = curID;
      task.order = "Med";
      task.status = "To-Do";
      tasks_todo.push(task);
      console.log(tasks_todo);
      render();
    }
  });
};

initModal = function () {
  // var btn = $("btn");
  var model = $("myModel");
  var close = $("close");
  $("myModel2").style.display = "none";
  $("cam").ontouchend = function () {
    $("myModel2").style.display = "block";
  };
  $("close_2").ontouchend = function () {
    $("myModel2").style.display = "none";
  };
  $("edit_note_confirm_2").ontouchend = function () {
    $("myModel2").style.display = "none";
  };
  close.ontouchend = function () {
    model.style.display = "none";
  };
  window.ontouchend = function (event) {
    if (event.target == model) {
      model.style.display = "none";
    }
  };
};

initEmail = function () {};

LongPress = function (id) {
  console.log(id + " 300S长按被触发");
  $("myModel").style.display = "block";
  for (var i = 0; i < tasks_todo.length; i++) {
    if (tasks_todo[i].id == id) {
      $("detail-title").innerHTML = "Details of Task# " + id;
      $("edit_title").value = tasks_todo[i].title || "";
      $("edit_tag").value = tasks_todo[i].tag || "";
      $("edit_start_year").value = tasks_todo[i].start_year || "";
      $("edit_start_month").value = tasks_todo[i].start_month || "";
      $("edit_start_day").value = tasks_todo[i].start_day || "";
      $("edit_start_hour").value = tasks_todo[i].start_hour || "";
      $("edit_end_year").value = tasks_todo[i].end_year || "";
      $("edit_end_month").value = tasks_todo[i].end_month || "";
      $("edit_end_day").value = tasks_todo[i].end_day || "";
      $("edit_end_hour").value = tasks_todo[i].end_hour || "";
      $("edit_order").value = tasks_todo[i].order || "";
      $("edit_info").value = tasks_todo[i].info || "";
      break;
    }
  }
  $("edit_note_cancel").addEventListener("touchend", function () {
    $("myModel").style.display = "none";
  });

  save_datails = function () {
    if ($("edit_title").value == "") {
      alert("Title can't be empty！");
    } else {
      for (var i = 0; i < tasks_todo.length; i++) {
        if (tasks_todo[i].id == id) {
          tasks_todo[i].title = $("edit_title").value;
          tasks_todo[i].tag = $("edit_tag").value;
          tasks_todo[i].start_year = $("edit_start_year").value;
          tasks_todo[i].start_month = $("edit_start_month").value;
          tasks_todo[i].start_day = $("edit_start_day").value;
          tasks_todo[i].start_hour = $("edit_start_hour").value;
          tasks_todo[i].end_year = $("edit_end_year").value;
          tasks_todo[i].end_month = $("edit_end_month").value;
          tasks_todo[i].end_day = $("edit_end_day").value;
          tasks_todo[i].end_hour = $("edit_end_hour").value;
          tasks_todo[i].order = $("edit_order").value;
          console.log($("edit_order").value, id);
          tasks_todo[i].info = $("edit_info").value;
          break;
        }
      }
    }
    console.log(tasks_todo);
    render();
    $("myModel").style.display = "none";
    $("edit_note_confirm").removeEventListener("touchend", save_datails);
  };
  $("edit_note_confirm").addEventListener("touchend", save_datails);
};

var touchstartHandler = function (event) {
  timer = setTimeout(LongPress, 500, this.id);
};

var touchmoveHandler = function (event) {
  event.preventDefault();
  clearTimeout(timer);
  timer = null;
};

var touchendHandler = function (event) {
  event.preventDefault();
  clearTimeout(timer);
  return false;
};

render = function () {
  tasks_displayed = tasks_todo;
  listDiv = $("todoList");
  listDiv.innerHTML = "";
  for (var i = 0; i < tasks_displayed.length; i++) {
    var itemDiv = document.createElement("div");
    var itemPriInd = document.createElement("div");
    var itemTickDiv = document.createElement("div");
    var itemContentDiv = document.createElement("div");
    var itemDeleteButton = document.createElement("button");
    if (tasks_displayed[i].status == "To-Do") {
      itemTickDiv.className = "iconfont icon-todolist-choose";
      itemDiv.className = "list-item";
    } else {
      itemTickDiv.className = "iconfont icon-todo";
      itemDiv.className = "list-item completed";
    }
    if (tasks_displayed[i].order == "High") itemPriInd.className = "High-Pri";
    else if (tasks_displayed[i].order == "Low")
      itemPriInd.className = "Low-Pri";
    else itemPriInd.className = "Med-Pri";

    itemDiv.id = tasks_displayed[i].id;
    itemContentDiv.innerHTML = tasks_displayed[i].title;
    itemContentDiv.className = "content";
    itemDeleteButton.type = "button";
    itemDeleteButton.innerHTML = " X ";
    itemDeleteButton.className = "delete";

    itemDiv.appendChild(itemPriInd);
    itemDiv.appendChild(itemTickDiv);
    itemDiv.appendChild(itemContentDiv);
    itemDiv.appendChild(itemDeleteButton);
    listDiv.insertBefore(itemDiv, listDiv.firstChild);

    // Complete
    itemDiv.addEventListener("touchend", function () {
      if (this.classList.contains("completed")) {
        this.classList.remove("completed");
      } else {
        this.classList.add("completed");
      }
      shiftTaskStatus(this.id);
    });

    // Delete
    itemDeleteButton.addEventListener("touchend", function () {
      removeTask(this.parentNode.id);
      clearTimeout(timer);
      timer = null;
      event.stopPropagation();
    });

    // Modify
    itemDiv.addEventListener("touchstart", touchstartHandler, false);
    itemDiv.addEventListener("touchmove", touchmoveHandler, false);
    itemDiv.addEventListener("touchend", touchendHandler, false);
  }

  updateActive(tasks_displayed);
  localStorage.setItem("tasks", JSON.stringify(tasks_todo));
};
