function getLondonDateParts(nowMs) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "numeric",
        day: "numeric"
    });
    const parts = formatter.formatToParts(new Date(nowMs));
    const map = {};

    parts.forEach(function(part) {
        if (part.type !== "literal") {
            map[part.type] = Number(part.value);
        }
    });

    return {
        year: map.year,
        month: map.month,
        day: map.day
    };
}

function toDaySerial(year, month, day) {
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function getCampaignProgressLondon(options) {
    const nowMs = options && typeof options.nowMs === "number" ? options.nowMs : Date.now();
    const current = getLondonDateParts(nowMs);
    const campaignYear = options && options.year ? options.year : current.year;
    const start = options && options.start ? options.start : { month: 3, day: 23 };
    const end = options && options.end ? options.end : { month: 4, day: 5 };
    const todaySerial = toDaySerial(current.year, current.month, current.day);
    const startSerial = toDaySerial(campaignYear, start.month, start.day);
    const endSerial = toDaySerial(campaignYear, end.month, end.day);

    if (todaySerial < startSerial) {
        return {
            state: "before",
            dayNumber: 0,
            totalDays: endSerial - startSerial + 1,
            isFinalDay: false,
            londonMonth: current.month,
            londonDay: current.day,
            todaySerial: todaySerial,
            endSerial: endSerial
        };
    }

    if (todaySerial > endSerial) {
        return {
            state: "after",
            dayNumber: endSerial - startSerial + 1,
            totalDays: endSerial - startSerial + 1,
            isFinalDay: false,
            londonMonth: current.month,
            londonDay: current.day,
            todaySerial: todaySerial,
            endSerial: endSerial
        };
    }

    const dayNumber = todaySerial - startSerial + 1;
    const totalDays = endSerial - startSerial + 1;
    return {
        state: "active",
        dayNumber: dayNumber,
        totalDays: totalDays,
        isFinalDay: todaySerial === endSerial,
        londonMonth: current.month,
        londonDay: current.day,
        todaySerial: todaySerial,
        endSerial: endSerial
    };
}

function initUkCampaignCountdown(config) {
    const root = document.querySelector(config.rootSelector);
    const dayEl = document.querySelector(config.daySelector);
    const monthEl = document.querySelector(config.monthSelector);

    if (!root || !dayEl || !monthEl) {
        return null;
    }

    let previousLabel = "";
    let animationIntervalId = null;
    let animationRestartTimeoutId = null;
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const msInDay = 1000 * 60 * 60 * 24;
    config.countdownDateCurrent = config.start.timestamp;

    function serialToDayMonth(serial) {
        const utcDate = new Date(serial * 86400000);
        return {
            day: utcDate.getUTCDate(),
            month: utcDate.getUTCMonth() + 1
        };
    }

    function animateTick(animateMonth, isLastDate=false) {
        //if (config.countdownDateCurrent >= config.end.timestamp)
        //    return;
        const animationClass = isLastDate ? ['animate--last'] : ['animate']
        dayEl.classList.remove('animate');
        void dayEl.offsetWidth;
        dayEl.classList.add(...animationClass);
        if (animateMonth) {
            monthEl.classList.remove('animate');
            void monthEl.offsetWidth;
            monthEl.classList.add(...animationClass);
        }
    }

    function stopAnimationLoop() {
        if (animationIntervalId) {
            window.clearInterval(animationIntervalId);
            animationIntervalId = null;
        }
        if (animationRestartTimeoutId) {
            window.clearTimeout(animationRestartTimeoutId);
            animationRestartTimeoutId = null;
        }
    }

    function renderDate(dayNumber, monthNumber) {
        const monthText = monthNames[monthNumber - 1];
        const nextLabel = String(dayNumber) + "|" + monthText;
        //const previousMonth = previousLabel ? previousLabel.split("|")[1] : "";
        //const monthChanged = previousMonth !== "" && previousMonth !== monthText;
        setTimeout(function(){
            dayEl.textContent = String(dayNumber);
            monthEl.textContent = monthText;
        }, config.animationStepMs);
        if (previousLabel !== nextLabel) {
            animateTick(isMonthChange(monthNumber));
            previousLabel = nextLabel;
        }
    }

    function isMonthChange(monthNumber) {
        const monthText = monthNames[monthNumber - 1];
        const previousMonth = previousLabel ? previousLabel.split("|")[1] : "";
        return previousMonth !== "" && previousMonth !== monthText;
    }

    function startAnimatedCountdown(todaySerial, endSerial) {
        stopAnimationLoop();
        let serial = todaySerial;
        const first = serialToDayMonth(serial);
        renderDate(first.day, first.month);
        root.classList.remove("hidden");

        animationIntervalId = window.setInterval(function() {
            if (serial >= endSerial) {
                stopAnimationLoop();
                /*
                animationRestartTimeoutId = window.setTimeout(function() {
                    const latest = getCampaignProgressLondon({
                        year: config.year,
                        start: config.start,
                        end: config.end
                    });
                    if (latest.state === "active") {
                        startAnimatedCountdown(latest.todaySerial, latest.endSerial);
                    }
                }, config.loopPauseMs || 1200);
                */
                animateTick(false, true);
                return;
            }

            config.countdownDateCurrent = config.countdownDateCurrent + msInDay;
            serial += 1;
            const next = serialToDayMonth(serial);
            renderDate(next.day, next.month);
        }, config.animationStepMs || 220);
    }

    function render() {
        const progress = getCampaignProgressLondon({
            year: config.year,
            start: config.start,
            end: config.end
        });

        document.querySelectorAll('.countdown-value').forEach(function(elem) {
            elem.style.animationDuration = config.animationStepMs;
        })

        if (progress.state === "before") {
            stopAnimationLoop();
            dayEl.textContent = "";
            monthEl.textContent = "";
            root.classList.add("hidden");
            previousLabel = "";
            return;
        }

        if (progress.state === "after") {
            stopAnimationLoop();
            dayEl.textContent = "!";
            monthEl.textContent = "Deadline reached";
            root.classList.remove("hidden");
            if (previousLabel !== "!|Deadline reached") {
                animateTick(true);
                previousLabel = "!|Deadline reached";
            }
            return;
        }

        startAnimatedCountdown(progress.todaySerial, progress.endSerial);
    }

    render();
    const intervalId = window.setInterval(render, config.updateIntervalMs || 60000);
    return {
        refresh: render,
        destroy: function() {
            stopAnimationLoop();
            window.clearInterval(intervalId);
        }
    };
}



function AnimationController() {
    const frame1Copy = document.querySelector('#frame-1-copy');
    const frame2Copy = document.querySelector('#frame-2-copy');
    const frame3Copy = document.querySelector('#frame-3-copy');
    const logo = document.querySelector('.logo-wrapper');
    const cta = document.querySelector('.cta-wrapper');
    //const countdown = document.querySelector('#countdown');
    const landscapeSizes = ['728x90','970x250'];
    const size = document.querySelector('#ad-container').className.split(' ').at(-1).replace('size-','');
    let timeout;
    let timeoutIncrement;
    let countdown;

    const now = new Date();
    const monthNow = now.getMonth()+1;
    const dayNow = now.getDate();
    const end = new Date('2026-04-05');
    //const end = new Date('2026-03-26'); // uncomment this and change the date to test for [<4,<8,>8] days left
    const monthEnd = end.getMonth()+1;
    const dayEnd = end.getDate();
    const diffInMs = end - now;
    const msInDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil(diffInMs / msInDay);
    let animationStepMs = 500;
    if (daysLeft <= 4) {
        animationStepMs = 500;
    }
    else if (daysLeft <= 8) {
        animationStepMs = 400;
    }
    timeoutIncrement = daysLeft * animationStepMs;
    timeoutIncrement = 2000;
    //console.log('daysLeft:',daysLeft,' animationStepMs:',animationStepMs,' timeoutIncrement:',timeoutIncrement);

    timeout = [
        900, // 0
        4000, // 1
    ]
    timeout.push(timeout[1]+timeoutIncrement+3000); // 2
    timeout.push(timeout[2]+500); // 3
    timeout.push(timeout[3]+2500); // 4
    timeout.push(timeout[4]+500); // 5

    //console.log(timeout)

    // frame 0
    animateChildNodes(frame1Copy, timeout[0]);

    // frame 1
    setTimeout(function(){
        setTimeout(function(){
            /*
            initUkCampaignCountdown({
                rootSelector: "#countdown",
                daySelector: "#campaign-date-day",
                monthSelector: "#campaign-date-month",
                start: { month: monthNow, day: dayNow, timestamp: now.getTime() },
                end: { month: monthEnd, day: dayEnd, timestamp: end.getTime() },
                animationStepMs: animationStepMs,
                loopPauseMs: 20000,
                updateIntervalMs: 60000
            });
            countdown.classList.add('animated');
            */
           countdown = new Countdown({
                timezone: 'Europe/London',
                daysOffset: 3,
                end: '2026-04-05', // YYYY-MM-DD
                elems: {
                    wrapper: '#countdown',
                    tens: '#countdown .digit-tens .digits-stack',
                    ones: '#countdown .digit-ones .digits-stack',
                }
            });
        }, 600);

        frame1Copy.classList.add('animated');
    }, timeout[1]); // 4s (base)

    // frame 2
    setTimeout(function(){
        frame1Copy.classList.add('exit');

        if (landscapeSizes.includes(size)) {
            logo.classList.add('animated','exit-right');
        }

        //countdown.classList.remove('animated');
        document.querySelector('#countdown').classList.remove('animate');
    }, timeout[2]);

    // frame 3
    setTimeout(function(){
        frame1Copy.classList.add('hide');
        frame2Copy.classList.remove('hide');

        const delayInterval = landscapeSizes.includes(size) ? 0 : 100;
        animateChildNodes(frame2Copy, 100, delayInterval);

        if (landscapeSizes.includes(size)) {
            logo.classList.remove('animated','exit-right');
            logo.dataset.animation = 'fade-in';
            cta.classList.add('show');
            cta.querySelector('.footer').dataset.animation = 'fade-in';
        
            setTimeout(function(){
                logo.classList.add('animated');
            }, 100);
            setTimeout(function(){
                cta.classList.add('animated');
            }, 200);
        }
    }, timeout[3]);
    
    // frame 4
    setTimeout(function(){
        if (landscapeSizes.includes(size)) {
            frame2Copy.classList.add('animated','exit-up');
        }
        else {
            frame2Copy.classList.add('animated','exit');
            logo.classList.add('animated','exit-down');
        }
    }, timeout[4]);

    // frame 5
    setTimeout(function(){
        if (!landscapeSizes.includes(size)) {
            logo.classList.remove('animated','exit-down');
            logo.dataset.animation = 'fade-in';
            cta.classList.add('show');
        }
        frame2Copy.classList.add('hide');
        frame3Copy.classList.remove('hide');

        const delayInterval = landscapeSizes.includes(size) ? 0 : 100;
        animateChildNodes(frame3Copy, 100, delayInterval);

        if (!landscapeSizes.includes(size)) {
            setTimeout(function(){
                logo.classList.add('animated');
            }, 300);
            setTimeout(function(){
                cta.classList.add('animated');
            }, 400);
        }
        else {
            setTimeout(function(){
                cta.querySelector('.footer').classList.add('animated');
            }, 100);
        }
    }, timeout[5]);
        
    function animateChildNodes(parent, delay, delayIncrement=100) {
        parent.querySelectorAll('[data-animation]').forEach(function(child) {
            setTimeout(function(){
                child.classList.add('animated');
            }, delay);
            delay += delayIncrement;
        });
    }
}
