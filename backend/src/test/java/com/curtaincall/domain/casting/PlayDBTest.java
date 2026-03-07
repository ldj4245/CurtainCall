package com.curtaincall.domain.casting;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.io.IOException;

@Disabled("외부 PlayDB 서버에 의존하는 테스트 - CI 환경에서 실행 불가")
public class PlayDBTest {

    @Test
    public void testSearch() throws IOException {
        String url = "http://www.playdb.co.kr/playdb/playdbList.asp?sReqMainCategory=000001&sReqTextType=0&sReqText=" +
                java.net.URLEncoder.encode("체인지 로그인", "EUC-KR");
        org.jsoup.Connection.Response res = Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .method(org.jsoup.Connection.Method.GET)
                .execute();
        res.charset("EUC-KR");
        Document doc = res.parse();

        // Let's find all tables that might be the main result table
        System.out.println("container1 link:");
        for (Element link : doc.select("div.container1 a[href*=goDetail], div.container1 a[onclick*=goDetail]")) {
            System.out.println(link.text());
        }

        System.out.println("---");
        System.out.println("table 480 link:");
        for (Element link : doc.select("table[width=480] a[href*=goDetail], table[width=480] a[onclick*=goDetail]")) {
            System.out.println(link.text());
        }

        System.out.println("---");
        System.out.println("contents link:");
        for (Element link : doc.select("#contents a[href*=goDetail], #contents a[onclick*=goDetail]")) {
            System.out.println(link.text());
        }
    }
}
