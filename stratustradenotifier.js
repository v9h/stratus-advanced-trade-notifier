// ==UserScript==
// @name         Advanced Trade Notifier
// @include      http://www.strrev.com/
// @namespace    http://www.strrev.com/
// @version      1.2
// @description  Notifies user when new trades are available with trade details
// @author       goth
// @match        *://www.strrev.com/*
// @icon         https://www.strrev.com/img/logo_R.svg
// @grant        none
// @updateURL    NULL
// @downloadURL  NULL
// ==/UserScript==

(function() {
    'use strict';

    const inboundCountApiUrl = 'https://www.strrev.com/apisite/trades/v1/trades/inbound/count';
    const inboundCursorApiUrl = 'https://www.strrev.com/apisite/trades/v1/trades/inbound?cursor=';
    const tradeDetailsApiUrl = 'https://www.strrev.com/apisite/trades/v1/trades/';
    const headshotApiUrl = 'https://www.strrev.com/apisite/thumbnails/v1/users/avatar-headshot?size=420x420&format=png&userIds=';

    async function fetchInboundCount() {
        try {
            const response = await fetch(inboundCountApiUrl, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return data.count;
        } catch (error) {
            console.error('Failed to fetch inbound count:', error);
            return 0;
        }
    }

    async function fetchInboundTradeId() {
        try {
            const response = await fetch(inboundCursorApiUrl, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return data.data.length > 0 ? data.data[0].id : null;
        } catch (error) {
            console.error('Failed to fetch inbound trade ID:', error);
            return null;
        }
    }

    async function fetchTradeDetails(tradeId) {
        try {
            const response = await fetch(`${tradeDetailsApiUrl}${tradeId}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch trade details:', error);
            return null;
        }
    }

    async function fetchHeadshot(userId) {
        try {
            const response = await fetch(`${headshotApiUrl}${userId}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            return `https://www.strrev.com${data.data[0].imageUrl}`;
        } catch (error) {
            console.error('Failed to fetch headshot:', error);
            return 'https://www.strrev.com/img/logo_R.svg'; // Fallback icon
        }
    }

    async function checkForNewTrades() {
        const count = await fetchInboundCount();
        if (count > 0) {
            const tradeId = await fetchInboundTradeId();
            if (tradeId) {
                const tradeDetails = await fetchTradeDetails(tradeId);
                if (tradeDetails) {
                    const userOffer = tradeDetails.offers[0].userAssets.reduce((sum, asset) => sum + asset.recentAveragePrice, 0);
                    const otherOffer = tradeDetails.offers[1].userAssets.reduce((sum, asset) => sum + asset.recentAveragePrice, 0);
                    const userName = tradeDetails.user.displayName;
                    const userId = tradeDetails.user.id;
                    const userHeadshot = await fetchHeadshot(userId);
                    sendNotification(userOffer, otherOffer, userName, userHeadshot);
                }
            }
        }
    }

    function sendNotification(userOffer, otherOffer, userName, userHeadshot) {
        const notification = new Notification(`Trade received from ${userName}!`, {
            body: `${userOffer} RAP vs ${otherOffer} RAP`,
            icon: userHeadshot
        });

        notification.onclick = () => {
            window.open('https://www.strrev.com/My/Trades.aspx');
        };
    }

    function requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function init() {
        requestNotificationPermission();
        setInterval(checkForNewTrades, 1800000);
    }

    init();
})();