const { Jsoup: Jsoup } = org.jsoup;

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    if (msg.startsWith("몰리야")) {
        let command = msg.substring(4).trim();
        getWeather(command, replier);
    }
}

function getWeather(msg, replier) {
    msg = msg.replace(/\s+/g, "");
    if (msg.includes("날씨")) {
        let timeKeywords = ["오늘", "내일", "지금"];
        let timeKeyword = "오늘";
        let location = "";
        for (let keyword of timeKeywords) {
            if (msg.includes(keyword)) {
                timeKeyword = keyword;
                location = msg.replace(keyword, "").replace("날씨", "").trim();
                break;
            }
        }
        if (!location) {
            let splitMsg = msg.split("날씨");
            if (splitMsg.length > 1 && splitMsg[1].trim()) {
                location = splitMsg[1].trim();
            } else if (splitMsg[0].trim()) {
                location = splitMsg[0].replace("몰리야", "").trim();
            }
        }
        if (location) {
            replier.reply(location + "의 날씨를 알려드려요.");
            return replier.reply(getWeatherFromNaver(location, timeKeyword === "내일"));
        } else {
            return replier.reply("위치를 입력해주세요.");
        }
    }
}

function getWeatherFromNaver(location, isTomorrow) {
    let retMsg = '';
    try {
        let data = Jsoup.connect("https://m.search.naver.com/search.naver?&query=날씨+" + location).get();
        let geo = data.select(".top_wrap").select(".select_txt").text();
        if (isTomorrow) {
            let tomorrow = data.select(".weather_info")[1];
            let tomorrowTemp_AM = tomorrow.select(".temperature_text").get(0).text().replace("예측 온도", "");
            let tomorrowTemp_PM = tomorrow.select(".temperature_text").get(1).text().replace("예측 온도", "");
            let tomorrowSummary_AM = tomorrow.select(".temperature_info").get(0).select(".summary").text();
            let tomorrowRaining_AM = tomorrow.select(".temperature_info").get(0).select(".desc").text();
            let tomorrowSummary_PM = tomorrow.select(".temperature_info").get(1).select(".summary").text();
            let tomorrowRaining_PM = tomorrow.select(".temperature_info").get(1).select(".desc").text();
            let tomorrowFineDust_AM = tomorrow.select(".report_card_wrap").get(0).select("li.item_today").get(0).select(".txt").text();
            let tomorrowFineDust_PM = tomorrow.select(".report_card_wrap").get(1).select("li.item_today").get(0).select(".txt").text();
            retMsg += "[ 오전 ]\n";
            retMsg += iconToEmogi(tomorrowSummary_AM) + '　　' + tomorrowSummary_AM + "\n예상 온도　─　" + tomorrowTemp_AM + "\n\n";
            retMsg += "[ 오후 ]\n";
            retMsg += iconToEmogi(tomorrowSummary_PM) + '　　' + tomorrowSummary_PM + "\n예상 온도　─　" + tomorrowTemp_PM + "\n";
            retMsg += '\u200b'.repeat(500);
            retMsg += "\n──────────────────────\n";
            retMsg += "\n▶ 내일 " + geo + " 날씨\n";
            retMsg += "\n   [ 오전 ]";
            retMsg += "\n  - 예상 날씨 : " + tomorrowSummary_AM;
            retMsg += "\n  - 예상 온도 : " + tomorrowTemp_AM;
            retMsg += "\n  - 강수확률 : " + tomorrowRaining_AM;
            retMsg += "\n\n   [ 오후 ] ";
            retMsg += "\n  - 예상 날씨 : " + tomorrowSummary_PM;
            retMsg += "\n  - 예상 온도 : " + tomorrowTemp_PM;
            retMsg += "\n  - 강수확률 : " + tomorrowRaining_PM;
            retMsg += "\n\n──────────────────────\n";
            retMsg += "\n▶ 주간 날씨\n";
            let weekWeather = getWeekWeatherList(data);
            for (let day of weekWeather) {
                retMsg += "\n《 " + day[0] + " 》\n\n   [ 오전 ]\n  - 예상 날씨 : " + day[2] + " ( " + day[1] + " )\n  - 예상 온도 : " + day[5] + "\n\n   [ 오후 ]\n  - 예상 날씨 : " + day[4] + " ( " + day[3] + " )\n  - 예상 온도 : " + day[6] + "\n\n";
            }
        } else {
            let todayWeatherInfo = data.select(".weather_info")[0];
            let today = todayWeatherInfo.select("._today");
            let today_temp = today.select(".temperature_text strong").text().slice(5);
            let diff_temp = todayWeatherInfo.select(".temperature_info .temperature").text();
            let todayRaining1 = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(0).select(".rainfall").text();
            let todayRaining2 = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(1).select(".rainfall").text();
            let todaySummary = data.select(".temperature_info").get(0).select(".weather.before_slash").text();
            let todayTemp_AM = data.select(".cell_temperature").get(0).select(".lowest").get(0).text().replace("최저기온", "");
            let todayTemp_PM = data.select(".cell_temperature").get(0).select(".highest").get(0).text().replace("최고기온", "");
            let todayWeather_AM = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(0).select(".blind").text();
            let todayWeather_PM = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(1).select(".blind").text();
            let temperature_info = todayWeatherInfo.select(".temperature_info .sort");
            let feeling = '', humidity = '', wind = '', precipitation = '';
            for (let i = 0; i < temperature_info.length; i++) {
                let termText = temperature_info[i].select(".term").text().trim();
                let descText = temperature_info[i].select(".desc").text().trim();
                if (termText.indexOf('체감') > -1) feeling = descText;
                if (termText.indexOf('강수') > -1) precipitation = descText;
                if (termText.indexOf('습도') > -1) humidity = descText;
                if (termText.indexOf('풍') > -1) wind = descText;
            }
            let todayReports = todayWeatherInfo.select(".report_card_wrap").select("li.item_today");
            let fineDust = '', uvRays = '', sunset = '', sunrise = '';
            for (let i = 0; i < todayReports.length; i++) {
                let titleText = todayReports[i].select(".title").text().trim();
                let txtText = todayReports[i].select(".txt").text().trim();
                if (titleText == '미세먼지') fineDust = txtText;
                if (titleText.indexOf('자외선') > -1) uvRays = txtText;
                if (titleText.indexOf('일출') > -1) sunrise = txtText;
                if (titleText.indexOf('일몰') > -1) sunset = txtText;
            }
            retMsg += iconToEmogi(todaySummary) + '　　' + todaySummary + "\n";
            retMsg += "어제보다 " + diff_temp + "　─　" + today_temp + "\n";
            retMsg += '\u200b'.repeat(500);
            retMsg += "\n──────────────────────\n";
            retMsg += "\n▶ 현재 " + geo + " 날씨\n";
            retMsg += "\n현재 온도　──　　" + today_temp + " (어제보다 " + diff_temp + ")";
            if (feeling != '') retMsg += "\n체감 온도　──　　" + feeling;
            if (precipitation != '') retMsg += "\n강수량　──　　" + precipitation;
            if (humidity != '') retMsg += "\n현재 습도　──　　" + humidity;
            if (wind != '') retMsg += "\n현재 풍속　──　　" + wind;
            if (sunrise != '') retMsg += "\n오늘 일출　──　　" + sunrise;
            if (sunset != '') retMsg += "\n오늘 일몰　──　　" + sunset;
            if (fineDust != '') retMsg += "\n미세먼지 　──　　" + fineDust;
            if (uvRays != '') retMsg += "\n자외선    　──　　" + uvRays;
            retMsg += "\n\n──────────────────────\n";
            retMsg += "\n▶ 오늘 " + geo + " 날씨\n";
            retMsg += "\n   [ 오전 ]";
            retMsg += "\n  - 예상 날씨 : " + todayWeather_AM;
            retMsg += "\n  - 예상 온도 : " + todayTemp_AM;
            retMsg += "\n  - 강수확률 : " + todayRaining1;
            retMsg += "\n\n   [ 오후 ] ";
            retMsg += "\n  - 예상 날씨 : " + todayWeather_PM;
            retMsg += "\n  - 예상 온도 : " + todayTemp_PM;
            retMsg += "\n  - 강수확률 : " + todayRaining2;
        }
    } catch (e) {
        retMsg = "날씨 정보를 가져오지 못했어요.";
        Log.e(e);
    }
    return retMsg;
}

function getWeekWeatherList(html) {
    try {
        let result = [];
        const weekWeatherList = html.select("div.content_area._weekly_weather_wrap > div > div > div.list_box._weekly_weather > ul > li").toArray();
        for (let n in weekWeatherList) {
            let date = weekWeatherList[n].select("div.cell_date").text();
            let rainfall_am = weekWeatherList[n].select("div.cell_weather > span:nth-child(1) > span > span.rainfall").text();
            let icon_am = weekWeatherList[n].select("div.cell_weather > span:nth-child(1) > i").text();
            let rainfall_pm = weekWeatherList[n].select("div.cell_weather > span:nth-child(2) > span > span.rainfall").text();
            let icon_pm = weekWeatherList[n].select("div.cell_weather > span:nth-child(2) > i").text();
            let temper = weekWeatherList[n].select("div.cell_temperature").text().split("/");
            result.push([
                date,
                rainfall_am,
                iconToEmogi(icon_am),
                rainfall_pm,
                iconToEmogi(icon_pm),
                temper[0].replace("최저기온", ""),
                temper[1].replace(" 최고기온", "")
            ]);
        }
        return result;
    } catch (e) {
        return e + "\n#" + e.lineNumber;
    }
}

const weather_icon = {
    "맑음": "☀️",
    "구름조금": "⛅",
    "구름많음": "🌥️",
    "구름많고 비": "🌧️",
    "구름많고 가끔 비": "🌧️",
    "구름많고 한때 비": "🌧️",
    "구름많고 가끔 소나기": "🌦️",
    "구름많고 한때 소나기": "🌦️",
    "흐림": "☁️",
    "소나기": "💧",
    "비": "💧",
    "흐리고 비": "🌧️",
    "흐리고 소나기": "🌧️",
    "흐리고 가끔 비": "🌦️",
    "흐리고 한때 비": "🌦️",
    "눈": "🌨️",
    "흐리고 가끔 소나기": "🌦️",
    "흐리고 한때 소나기": "🌦️"
};

function iconToEmogi(icon) {
    icon = icon.replace(" 곳", "");
    if (weather_icon[icon] == undefined) {
        Api.makeNoti("날씨 아이콘 없음", icon);
        return icon;
    }
    return weather_icon[icon];
}


