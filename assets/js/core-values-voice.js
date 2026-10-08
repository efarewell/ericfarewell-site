(function () {
  'use strict';

  var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var active = null;

  function setStatus(status, message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function finish(session, message, isError) {
    if (!session) return;
    session.button.classList.remove('is-listening');
    session.button.removeAttribute('aria-pressed');
    session.button.innerHTML = session.idleMarkup;
    setStatus(session.status, message || 'Ready when you are.', isError);
    if (active === session) active = null;
  }

  function appendTranscript(field, words) {
    var text = String(words || '').trim();
    if (!text) return;
    var before = field.value.trim();
    field.value = before ? before + ' ' + text : text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }

  function decorate(field) {
    if (field.dataset.voiceReady || field.readOnly || field.disabled) return;
    field.dataset.voiceReady = 'true';

    var tools = document.createElement('div');
    tools.className = 'cv-voice-tools';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'cv-voice-btn';
    var idleMarkup = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"/></svg><span>Speak this story</span>';
    button.innerHTML = idleMarkup;

    var status = document.createElement('span');
    status.className = 'cv-voice-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = Recognition
      ? "I'll turn what you say into text here. Your browser will ask for microphone access."
      : "Voice typing isn't supported in this browser. Your device's keyboard dictation will still work.";

    if (!Recognition) button.disabled = true;

    button.addEventListener('click', function () {
      if (!Recognition) return;
      if (active && active.field === field) {
        active.recognition.stop();
        return;
      }
      if (active) active.recognition.stop();

      var recognition = new Recognition();
      recognition.lang = document.documentElement.lang || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      var session = { field: field, button: button, status: status, recognition: recognition, idleMarkup: idleMarkup };
      active = session;

      recognition.onstart = function () {
        button.classList.add('is-listening');
        button.setAttribute('aria-pressed', 'true');
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"/></svg><span>Stop listening</span>';
        setStatus(status, 'Listening. Tell the story the way you would say it to a person.', false);
      };

      recognition.onresult = function (event) {
        var finalText = '';
        var interimText = '';
        for (var i = event.resultIndex; i < event.results.length; i += 1) {
          var words = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += words + ' ';
          else interimText += words;
        }
        if (finalText.trim()) appendTranscript(field, finalText);
        setStatus(status, interimText.trim() ? 'Hearing: ' + interimText.trim() : 'Listening. Keep going, or stop when the story is out.', false);
      };

      recognition.onerror = function (event) {
        var messages = {
          'not-allowed': 'Microphone access was not allowed. You can enable it in your browser settings or keep typing.',
          'audio-capture': 'I could not find a working microphone.',
          'no-speech': 'I did not hear anything. Try again when you are ready.',
          'network': 'Voice typing could not reach your browser\'s speech service. Your typed work is still here.'
        };
        finish(session, messages[event.error] || 'Voice typing stopped before I could add anything.', true);
      };

      recognition.onend = function () {
        if (active === session) finish(session, 'Stopped. You can edit the text or keep speaking.', false);
      };

      try {
        recognition.start();
      } catch (error) {
        finish(session, 'Voice typing is already starting. Give it a moment and try again.', true);
      }
    });

    tools.appendChild(button);
    tools.appendChild(status);
    field.insertAdjacentElement('afterend', tools);
  }

  function scan(root) {
    (root || document).querySelectorAll('.cv textarea[data-in="story"]').forEach(decorate);
  }

  function start() {
    scan(document);
    var app = document.getElementById('cv-app');
    if (!app || !window.MutationObserver) return;
    new MutationObserver(function () {
      if (active && !document.documentElement.contains(active.field)) active.recognition.stop();
      scan(app);
    }).observe(app, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
