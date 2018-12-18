// Content script: Runs in all tabs and injects scripts into the page when appropriate.

'use strict';

injectFunction(notifyOnNewPost);

/* --------------------------------------- Main functions --------------------------------------- */

function injectFunction(targetFunction, variables = {}) {
  // Get the body of the function as string
  let functionBody = targetFunction.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];

  // Replace variables needed in the function body string
  Object.keys(variables).forEach((variable) => {
    const variableValue = JSON.stringify(variables[variable]);
    functionBody = functionBody.replace(new RegExp(variable, 'g'), variableValue);
  });

  // Add script to page
  addScriptsToDOM(functionBody);
}

// Add JavaScript to the page
function addScriptsToDOM(content, parentNode = document.head) {
  const scriptElement = document.createElement('script');
  scriptElement.type = 'text/javascript';
  scriptElement.textContent = content;

  parentNode.appendChild(scriptElement);
}

/* ------------------------------------- Injected functions ------------------------------------- */

/* eslint no-param-reassign: 0, no-unused-vars: 0 */
function notifyOnNewPost(PP) {
  // Ask for notification permission if it's not granted or denied yet
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Keep track of the notification not to display it twice
  let isNotificationDisplayed = false;

  // Wrap the PP object in a Proxy to catch when a new post arrives
  PP = new Proxy(PP, {
    get: (object, property, receiver) => {
      if (property === 'newPostsPP' && document.hidden && !isNotificationDisplayed) {
        const notification = new Notification('Új poszt a hírfolyamban!', {
          body: 'Kattints ide, hogy lásd az Index oldalán.',
          icon: '/assets/images/favicons/favicon-32x32.png',
          requireInteraction: true
        });

        isNotificationDisplayed = true;

        notification.onclick = () => {
          // Bring the tab to focus and load the new posts
          window.focus();
          PP.loadPPtrigger();

          notification.close();
          isNotificationDisplayed = false;
        };

        notification.onclose = () => {
          isNotificationDisplayed = false;
        };
      }

      // Always return the original member
      return Reflect.get(object, property, receiver);
    }
  });
}
