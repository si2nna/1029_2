// ==UserScript==
// @name         좌우 패널 크기 조절
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  가운데 나누는 줄을 드래그하여 좌우 패널 넓이를 자유롭게 조절합니다.
// @match        https://crack.wrtn.ai/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const storageKey = 'saved-split-panel-width';
    let isResizing = false;

    function initSplitter() {
        if (document.getElementById('custom-panel-resizer')) return;

        const rightInner = document.querySelector('div[style*="overflow: auto"] > div.h-fit.pt-5');
        if (!rightInner) return;

        let rightSide = rightInner;
        let container = null;
        let leftSide = null;

        while (rightSide.parentElement && rightSide.parentElement.tagName !== 'BODY') {
            const parent = rightSide.parentElement;
            const style = window.getComputedStyle(parent);

            if ((style.display === 'flex' || style.display === 'inline-flex') && style.flexDirection === 'row') {
                const children = Array.from(parent.children).filter(el => el.tagName !== 'SCRIPT' && el.id !== 'custom-panel-resizer');
                const index = children.indexOf(rightSide);

                if (index > 0) {
                    leftSide = children[index - 1];
                    container = parent;
                    break;
                }
            }
            rightSide = parent;
        }

        if (!container || !leftSide || !rightSide) return;

        const resizer = document.createElement('div');
        resizer.id = 'custom-panel-resizer';
        resizer.style.cssText = `
            width: 12px;
            cursor: col-resize;
            background-color: transparent;
            position: relative;
            z-index: 9999;
            margin-left: -6px;
            margin-right: -6px;
            transition: background-color 0.2s;
        `;

        resizer.onmouseover = () => resizer.style.backgroundColor = 'rgba(98, 0, 238, 0.2)';
        resizer.onmouseout = () => { if (!isResizing) resizer.style.backgroundColor = 'transparent'; };

        leftSide.after(resizer);

        const savedWidth = localStorage.getItem(storageKey);
        if (savedWidth) {
            leftSide.style.setProperty('width', savedWidth, 'important');
            leftSide.style.setProperty('max-width', 'none', 'important');
            leftSide.style.flex = 'none';
            rightSide.style.flex = '1 1 0%';
        }

        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.documentElement.style.userSelect = 'none';
            resizer.style.backgroundColor = 'rgba(98, 0, 238, 0.4)';

            const iframeBlocker = document.createElement('div');
            iframeBlocker.id = 'iframe-drag-blocker';
            iframeBlocker.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; cursor: col-resize;';
            document.body.appendChild(iframeBlocker);
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const containerRect = container.getBoundingClientRect();
            let newWidth = e.clientX - containerRect.left;

            const minWidth = 50;
            const maxWidth = containerRect.width - 50;
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;

            leftSide.style.setProperty('width', newWidth + 'px', 'important');
            leftSide.style.setProperty('max-width', 'none', 'important');
            leftSide.style.flex = 'none';
            rightSide.style.flex = '1 1 0%';
        });

        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.documentElement.style.userSelect = '';
                resizer.style.backgroundColor = 'transparent';

                const blocker = document.getElementById('iframe-drag-blocker');
                if (blocker) blocker.remove();

                localStorage.setItem(storageKey, leftSide.style.width);
            }
        });
    }

    const observer = new MutationObserver(() => initSplitter());
    observer.observe(document.body, { childList: true, subtree: true });

})();