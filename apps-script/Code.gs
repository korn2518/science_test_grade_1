/**
 * 과학 1 단원평가 기록보관소 점수 수집기 (Google Apps Script)
 *
 * 1. 점수를 모을 Google 스프레드시트를 새로 만듭니다.
 * 2. 확장 프로그램 → Apps Script를 열고 이 코드를 모두 붙여 넣은 뒤 저장합니다.
 * 3. 아래 TOKEN에 학생 앱과 같은 비밀 문구를 적습니다(config.js의 token과 같아야 함).
 * 4. 배포 → 새 배포 → 유형: 웹 앱
 *    - 다음 사용자 인증 정보로 실행: 나
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 * 5. 나온 웹 앱 URL(…/exec)을 config.js의 scoreUrl에 붙여 넣습니다.
 */

const TOKEN = "dure-science-2026";   // config.js의 token과 똑같이 적으세요.
const SHEET_NAME = "점수";
const HEAD = [
  "제출 시각", "학년", "반", "번호", "이름", "단원", "유형",
  "선택형(60)", "서술형 자동(40)", "총점", "교사 확인 총점",
  "걸린 시간", "제한 시간(분)", "화면 이탈", "자동 제출", "선택형 오답 번호",
  "16번 점수", "16번 답안", "17번 점수", "17번 답안", "18번 점수", "18번 답안",
  "19번 점수", "19번 답안", "20번 점수", "20번 답안",
  "앱 버전", "기록 ID"
];

function doGet() {
  return json_({ ok: true, app: "science1-exam-archive", message: "점수 수집기가 작동 중입니다." });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (TOKEN && d.token !== TOKEN) return json_({ ok: false, error: "비밀 문구(token)가 맞지 않습니다." });

    const sh = sheet_();
    const last = sh.getLastRow();
    if (last >= 2) {
      const ids = sh.getRange(2, HEAD.length, last - 1, 1).getValues().flat();
      if (ids.indexOf(d.id) !== -1) return json_({ ok: true, duplicate: true });
    }

    const row = [
      Utilities.formatDate(new Date(d.at), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss"),
      Number(d.grade), Number(d.cls), Number(d.num), String(d.name),
      d.unit, d.set, d.mc, d.sa, d.total, "",
      d.usedText, d.limit, d.leaves, d.auto ? "예" : "", (d.wrong || []).join(", ")
    ];
    (d.sa_items || []).forEach(x => row.push(x.score, "'" + String(x.text || "")));
    while (row.length < HEAD.length - 2) row.push("");
    row.push(d.version || "", d.id);
    sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight("bold").setBackground("#E4E9DF");
    sh.getRange(1, 11).setBackground("#F4E3B5");            // 교사 확인 총점 칸 강조
    sh.hideColumns(HEAD.length);                            // 기록 ID는 숨김
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
