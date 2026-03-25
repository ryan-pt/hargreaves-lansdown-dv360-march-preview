function Countdown(options) {
    const setDates = () => {
        options.now = { date: new Date() };
        options.now = { ...getTimeIn(options.timezone, options.now.date), ...options.now };

        options.end = { date: new Date(options.end) };
        options.end = { ...getTimeIn(options.timezone, options.end.date), ...options.end };
    }

    function setDaysLeft() {
        const targetMonth = options.end.month-1; // 0-indexed
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
/*
    const getLastDateOfMonth = date => {
        const year = date.getFullYear();
        const month = date.getMonth()+1;
        return new Date(year, month, 0);
    }
    const setDaysInMonth = () => {
        options.now.daysInMonth = options.now.lastDayOfMonth - options.now.day;
        options.end.daysInMonth = options.end.lastDayOfMonth - options.end.day;   
    }
*/
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

        //return { ...{ lastDayOfMonth: getLastDateOfMonth(date).getDate() }, ...parts };
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

    return this;
}