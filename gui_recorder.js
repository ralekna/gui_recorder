/**
 * Created by rytis on 2015-09-01.
 */
var GUIRecorder = (function () {

  var MOUSE_EVENTS = 'mousemove mouseover mouseout mousedown mouseup click scroll'.split(' ');

  var WHEEL_EVENTS = '';

  var MAX_TIMEOUT = 5000;

  var BUTTONS_COLOR_TABLE = {
    0: 'rgba(158,   158, 158, 0.5)',
    1: 'rgba( 251,    8,   8, 0.5)',
    2: 'rgba(   8,  251,   8, 0.5)',
    3: 'rgba( 251,  251,   8, 0.5)',
    4: 'rgba(   8,    8, 251, 0.5)',
    5: 'rgba( 251,    8, 251, 0.5)',
    6: 'rgba(   8,  251, 251, 0.5)',
    7: 'rgba( 251,  251, 251, 0.5)'
  };

  function GUIRecorder () {
    var _this = this;
    this.logBound = function (event) {
      _this.logEvent(event);
    };
  }

  GUIRecorder.prototype.startRecording = function startRecording () {

    if (this.events) {
      throw new Error('Recording already started!');
    }

    this.events = [];
    var _this = this;

    for (var i = 0; i < MOUSE_EVENTS.length; i++) {
      window.document.addEventListener(MOUSE_EVENTS[i], this.logBound);
    }

    window.document.addEventListener('keyup', function (event) {
      _this.onKeyUpHandler(event);
    });

    console.log('Recording started!');

  };

  GUIRecorder.prototype.onKeyUpHandler = function (event) {
    if (event.keyCode == 27) { // escape
      this.stopRecording();
    }
  };

  GUIRecorder.prototype.stopRecording = function stopRecording () {

    if (!this.events) {
      throw new Error('Recording not started!');
    }

    var _this = this;
    var log = function (event) {
      _this.logEvent(event);
    };

    for (var i = 0; i < MOUSE_EVENTS.length; i++) {
      window.document.removeEventListener(MOUSE_EVENTS[i], this.logBound);
    }

    console.log('Recording stopped!');

  };

  GUIRecorder.prototype.playRecord = function () {
    playRecord(this.events);
  };

  function playRecord (record) {

    if (!record) {
      throw  new Error('record must be not null!');
    }

    var queue = record.concat().reverse();

    console.log('playback started with ' + queue.length + ' events');

    if (!queue.length) {
      return;
    }

    var cursor = getCursor();

    playNextEvent(queue);

    function playNextEvent (events, currentEvent) {
      if (currentEvent) {
        simulateEvent(currentEvent);
        // $(currentEvent.target).trigger(currentEvent);
        cursor.style.left = currentEvent.clientX + 'px';
        cursor.style.top = currentEvent.clientY + 'px';
        cursor.style.backgroundColor = BUTTONS_COLOR_TABLE[currentEvent.buttons]; // .buttons == 0 ) ? 'rgba(251, 8, 8, 0.5)' : 'rgba(158, 158, 158, 0.5)';
      }

      if (!events.length) {
        console.log('playback end');
        return;
      }
      var nextEvent = events.pop();
      var timeout = Math.min(nextEvent.timeStamp - ( currentEvent ? currentEvent.timeStamp : nextEvent.timeStamp ), MAX_TIMEOUT);

      // console.log('playing event:', nextEvent.type, nextEvent.clientX, nextEvent.clientY, nextEvent.target );

      setTimeout(function() {
        playNextEvent(events, nextEvent);
      }, timeout);
    }

  }

  function getCursor () {

    var cursor = document.getElementById('gui-recorder-cursor');

    if(!cursor) {
      cursor = document.createElement('div');
      cursor.style.position = 'fixed';
      cursor.style.width = '16px';
      cursor.style.height = '16px';
      cursor.style.backgroundColor = 'rgba(158, 158, 158, 0.5)';
      cursor.style.zIndex = 9999;
      cursor.id = 'gui-recorder-cursor';
      document.body.appendChild(cursor);
    }

    return cursor;

  }

  GUIRecorder.playRecord = playRecord;

  GUIRecorder.prototype.logEvent = function logEvent(event) {
    this.events.push(event);
    // console.log(event);
  };


  function simulateEvent(originalEvent) {
    var element = $(originalEvent.target);
    var event = jQuery.Event( originalEvent.type, originalEvent);
    element.trigger(event);

  }


  function getDomPath(el) {
    if (!el) {
      return;
    }
    var stack = [];
    var isShadow = false;
    while (el.parentNode != null) {
      // console.log(el.nodeName);
      var sibCount = 0;
      var sibIndex = 0;
      // get sibling indexes
      for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
        var sib = el.parentNode.childNodes[i];
        if ( sib.nodeName == el.nodeName ) {
          if ( sib === el ) {
            sibIndex = sibCount;
          }
          sibCount++;
        }
      }
      // if ( el.hasAttribute('id') && el.id != '' ) { no id shortcuts, ids are not unique in shadowDom
      //   stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
      // } else
      var nodeName = el.nodeName.toLowerCase();
      if (isShadow) {
        nodeName += "::shadow";
        isShadow = false;
      }
      if ( sibCount > 1 ) {
        stack.unshift(nodeName + ':nth-of-type(' + (sibIndex + 1) + ')');
      } else {
        stack.unshift(nodeName);
      }
      el = el.parentNode;
      if (el.nodeType === 11) { // for shadow dom, we
        isShadow = true;
        el = el.host;
      }
    }
    stack.splice(0,1); // removes the html element
    return stack.join(' > ');
  }

  function constructMouseEvent(type, sx, sy, cx, cy) {

    var evt;
    var e = {
      bubbles: true,
      cancelable: (type != "mousemove"),
      view: window,
      detail: 0,
      screenX: sx,
      screenY: sy,
      clientX: cx,
      clientY: cy,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: undefined
    };
    if (typeof( document.createEvent ) == "function") {
      evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(type,
        e.bubbles, e.cancelable, e.view, e.detail,
        e.screenX, e.screenY, e.clientX, e.clientY,
        e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
        e.button, document.body.parentNode);
    } else if (document.createEventObject) {
      evt = document.createEventObject();
      for (prop in e) {
        evt[prop] = e[prop];
      }
      evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
    }
    return evt;
  }

  return GUIRecorder;

})();
