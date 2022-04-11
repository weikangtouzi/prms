class DateBuilder {
    custom(start, end) {
        return {
            start,
            end,
            toMongoFilter: (lte, gte) => {
                let res = {}
                lte ? res.$lte = end : res.$lt = end
                gte ? res.$gte = start : res.$gt = start
                return res
            }
        }
    }
    until_now(start) {
        return this.custom(start, new Date())
    }
    monthly() {
        let start = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        return this.until_now(start)
    }
    weekly() {
        let start = get_this_monday()
        return this.until_now(start)
    }
    monthly_devided_into_days(monthly_data) {
        let start = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        return divided_into_days(monthly_data, new Date().getDate(), start)
    }
    weekly_devided_into_days(weekly_data) {
        let start = get_this_monday()
        return divided_into_days(weekly_data, new Date().getDay(), start)
    }
}
function get_this_monday() {
    let today = new Date().getDay()
    if (today == 1) return new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
    return new Date(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - 24 * 60 * 60 * (today - 1) * 1000)
}
function divided_into_days(data, days, start) {
    let res = []
    let condition = generate_condition_for_filter(days, start)
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < condition.length; j++) {
            if (!res[j]) res[j] = 0
            if (condition[j].run(data[i].register_time)) {
                res[j] += 1
            }
        }
    }
    return res
}
function generate_condition_for_filter(days, start) {
    let condition = []
    let start_inner = start
    for (let i = 0; i < days; i++) {
        let end = new Date(start_inner)
        end.setDate(end.getDate() + 1)
        condition.push({
            start: new Date(start_inner),
            end: new Date(end),
            run(date, lte = true, gte = true) {
                let res = true
                if (lte) {
                    res = res && date <= this.end
                } else {
                    res = res && date < this.end
                }
                if (gte) {
                    res = res && date >= this.start
                } else {
                    res = res && date > this.start
                }
                return res
            }
        })
        start_inner = end
    }
    return condition
}

module.exports = {
    DateBuilder
}