/**
 * CutCopy.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.paste.core.CutCopy',
  [
    'tinymce.core.Env',
    'tinymce.plugins.paste.core.InternalHtml'
  ],
  function (Env, InternalHtml) {
    var noop = function () {
    };

    var hasWorkingClipboardApi = function (clipboardData) {
      // iOS supports the clipboardData API but it doesn't do anything for cut operations
      return Env.iOS === false && clipboardData !== undefined && typeof clipboardData.setData === 'function';
    };

    var setHtml5Clipboard = function (clipboardData, html, text) {
      if (hasWorkingClipboardApi(clipboardData)) {
        try {
          clipboardData.clearData();
          clipboardData.setData('text/html', html);
          clipboardData.setData('text/plain', text);
          clipboardData.setData(InternalHtml.internalHtmlMime(), html);
          return true;
        } catch (e) {
          return false;
        }
      } else {
        return false;
      }
    };

    var setClipboardData = function (evt, data, fallback, done) {
      if (setHtml5Clipboard(evt.clipboardData, data.html, data.text)) {
        evt.preventDefault();
        done();
      } else {
        fallback(data.html, done);
      }
    };

    var fallback = function (editor) {
      return function (html, done) {
        var markedHtml = InternalHtml.mark(html);
        var outer = editor.dom.create('div', { contenteditable: "false" });
        var inner = editor.dom.create('div', { contenteditable: "true" }, markedHtml);
        editor.dom.setStyles(outer, {
          position: 'fixed',
          left: '-3000px',
          width: '1000px',
          overflow: 'hidden'
        });
        outer.appendChild(inner);
        editor.dom.add(editor.getBody(), outer);

        var range = editor.selection.getRng();
        inner.focus();

        var offscreenRange = editor.dom.createRng();
        offscreenRange.selectNodeContents(inner);
        editor.selection.setRng(offscreenRange);

        setTimeout(function () {
          outer.parentNode.removeChild(outer);
          editor.selection.setRng(range);
          done();
        }, 0);
      };
    };

    var getData = function (editor) {
      return {
        html: editor.selection.getContent(),
        text: editor.selection.getContent({ format: 'text' })
      };
    };

    var cut = function (editor) {
      return function (evt) {
        if (editor.selection.isCollapsed() === false) {
          setClipboardData(evt, getData(editor), fallback(editor), function () {
            editor.execCommand('Delete');
          });
        }
      };
    };

    var copy = function (editor) {
      return function (evt) {
        if (editor.selection.isCollapsed() === false) {
          setClipboardData(evt, getData(editor), fallback(editor), noop);
        }
      };
    };

    var register = function (editor) {
      editor.on('cut', cut(editor));
      editor.on('copy', copy(editor));
    };

    return {
      register: register
    };
  }
);