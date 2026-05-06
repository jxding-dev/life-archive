# Life Archive

개인의 기억을 날짜, 감정, 사진과 함께 보관하는 로컬 아카이브 앱입니다.

HTML, CSS, Vanilla JavaScript만 사용하는 정적 웹앱이며, 기록 데이터는 브라우저의 LocalStorage에, 이미지 데이터는 IndexedDB에 저장합니다.

## 주요 기능

- 기억 작성, 수정, 삭제
- 날짜별/연도별 기억 아카이브
- 감정 태그 기반 필터링
- "몇 년 전 오늘" 기억 표시
- 타임라인 보기
- 이미지 첨부 및 압축 저장
- 설정 화면의 JSON 백업/복원, 텍스트 내보내기
- PIN 잠금 및 초기 설정 화면
- 세피아/다크모드 테마
- 전체 기록 초기화, 앱 전체 초기화
- 데스크탑 사이드바와 모바일 하단 탭 네비게이션

## 실행 방법

별도 설치 과정은 필요 없습니다.

```txt
index.html
```

브라우저에서 `index.html`을 열어 실행합니다.

처음 사용하는 경우 `setup.html`에서 PIN을 설정한 뒤 앱을 사용할 수 있습니다.

## 저장 방식

- 기억 메타데이터: LocalStorage
- 이미지 데이터: IndexedDB
- 사용자 설정/PIN/테마: LocalStorage

이미지를 LocalStorage에 직접 넣지 않고 IndexedDB에 분리해 저장합니다.

## 주요 화면

- `index.html`: 홈, 오늘의 기록 요약, 몇 년 전 오늘
- `write.html`: 기억 작성 및 회고 질문
- `archive.html`: 전체 기억 아카이브, 검색/연도/감정 필터
- `detail.html`: 기억 상세 보기
- `timeline.html`: 시간순 기억 흐름
- `settings.html`: PIN, 테마, 백업/복원, 초기화 설정
- `setup.html`: 초기 PIN 설정
- `lock.html`: 잠금 해제

## 폴더 구조

```txt
life-archive/
├─ index.html
├─ write.html
├─ archive.html
├─ detail.html
├─ timeline.html
├─ export.html        # settings.html로 이동하는 이전 백업 경로
├─ settings.html
├─ setup.html
├─ lock.html
├─ css/
│  ├─ variables.css
│  ├─ style.css
│  └─ page-specific css files
├─ js/
│  ├─ app.js
│  ├─ storage.js
│  ├─ imageStorage.js
│  └─ page-specific js files
└─ data/
   └─ sample.json
```

## 개발 메모

- 기존 UI 감성을 유지하는 방향으로 수정합니다.
- 공통 스타일은 `css/variables.css`와 `css/style.css`를 우선 사용합니다.
- 페이지별 동작은 각 페이지 전용 JS 파일에서 관리합니다.
- 불필요한 라이브러리를 추가하지 않습니다.
- 로컬 인수인계 문서와 내부 문서는 `.gitignore`로 제외합니다.
https://life-archive.onrender.com
