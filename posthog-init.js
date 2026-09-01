(function () {
  'use strict';

  function reportMissing(variable) {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      throw new Error(variable + ' variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ' + variable + ' is configured');
    }
  }

  if (window.posthog) return;

  var posthog = [];
  window.posthog = posthog;
  posthog._i = [];
  posthog.init = function (token, options) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.src = options.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
    script.onload = function () {
      window.dispatchEvent(new Event('posthog_ready'));
    };
    document.head.appendChild(script);
    posthog._i.push([token, options]);
  };
  posthog.capture = function () {
    posthog.push(['capture'].concat(Array.prototype.slice.call(arguments)));
  };

  fetch('/api/posthog-config')
    .then(function (response) {
      if (!response.ok) throw new Error('Unable to load PostHog configuration');
      return response.json();
    })
    .then(function (config) {
      if (!config.token) {
        reportMissing('POSTHOG_PROJECT_TOKEN');
        return;
      }
      if (!config.host) {
        reportMissing('POSTHOG_HOST');
        return;
      }

      posthog.init(config.token, {
        api_host: config.host,
        defaults: '2026-05-30',
        cookieless_mode: 'always',
        person_profiles: 'never',
        autocapture: false,
        disable_session_recording: true,
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false
        }
      });
    })
    .catch(function (error) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') throw error;
    });
})();
