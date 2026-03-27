function Countdown(options) {
    const setDates = () => {
        options.now = { date: new Date() };

        options.end = { date: new Date(options.end) };
        options.end = { ...{
                day: options.end.date.getDate(),
                month: options.end.date.getMonth(),
            },
            ...options.end
        }
    }

    function setDaysLeft() {
        const targetMonth = options.end.month;
        const targetDay = options.end.day;

        const timeStr = new Date().toLocaleString("en-US", { timeZone: options.timezone });
        const now = new Date(timeStr);

        let end = new Date(timeStr);
        end.setMonth(targetMonth, targetDay);
        end.setHours(0, 0, 0, 0);

        if (now > end) {
            end.setFullYear(end.getFullYear() + 1);
        }

        const diffInMs = end - now;
        const daysLeft = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        options.daysLeft = daysLeft;
    }

    const getTimeIn = (timezone, date) => {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });

        const parts = formatter.formatToParts(date).reduce((acc, part) => {
            if (part.type !== 'literal') {
                acc[part.type] = parseInt(part.value);
            }
            return acc;
        }, {});

        return parts;
    }

    // for .digits-stack, generates the span elements per stack
    const getStacks = () => {
        const stack = { tens: '', ones: '' };

        for (let day = options.daysLeft+options.daysOffset; day >= options.daysLeft; day--) {
            const digitParts = Array.from(String(day), Number);
            const tens = digitParts.length > 1 ? digitParts[0] : 0;
            if (!stack.tens.includes(tens)) {
               stack.tens = `<span>${tens}</span>${stack.tens}`;
            }
            stack.ones = `<span>${digitParts.length > 1 ? digitParts[1] : digitParts[0]}</span>${stack.ones}`;
        }

        if (options.daysLeft > 9) {
            stack.tens = `${stack.tens}<span>0</span>`;
        }

        return stack;
    }

    const injectStacks = () => {
        const stacks = getStacks();
        document.querySelector(options.elems.tens).innerHTML = stacks.tens;
        document.querySelector(options.elems.ones).innerHTML = stacks.ones;
    }

    const init = () => {
        setDates();
        setDaysLeft();
        injectStacks();

        document.querySelector(options.elems.wrapper).classList.add('animate');

        this.options = options;
    }

    init();

    //return this;
}

function AnimationController() {
    const frame1Copy = document.querySelector('#frame-1-copy');
    const frame2Copy = document.querySelector('#frame-2-copy');
    const frame3Copy = document.querySelector('#frame-3-copy');
    const logo = document.querySelector('.logo-wrapper');
    const cta = document.querySelector('.cta-wrapper');
    const landscapeSizes = ['728x90','970x250'];
    const size = document.querySelector('#ad-container').className.split(' ').at(-1).replace('size-','');
    let timeout;
    let countdown;

    timeout = [
        900, // 0
        4000, // 1
    ]
    timeout.push(timeout[1]+5000); // 2
    timeout.push(timeout[2]+500); // 3
    timeout.push(timeout[3]+3500); // 4
    timeout.push(timeout[4]+500); // 5

    // frame 0
    animateChildNodes(frame1Copy, timeout[0]);

    // frame 1
    setTimeout(function(){
        setTimeout(function(){
           countdown = new Countdown({
                timezone: 'Europe/London',
                daysOffset: 5,
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
