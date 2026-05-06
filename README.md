# Life Archive

기억 조각 기반 감정 아카이브 웹앱

사진, 감정, 음악, 장소 같은 기억 조각을 기록하고  
시간 흐름에 따라 다시 돌아볼 수 있는 개인 아카이브 프로젝트입니다.

---

# 핵심 컨셉

- 기억 복원
- 감정 흐름 시각화
- 인생 타임라인
- 개인 디지털 회고록

긴 일기보다 짧은 기억 조각 중심으로 기록 부담을 줄였습니다.

---

# 주요 기능

## MVP

- 연도별 기억 기록
- 감정 태그 시스템
- 사진 저장 (IndexedDB)
- 기억 수정 / 삭제
- JSON 백업 및 복원
- PIN 잠금 기능

## 추가 예정

- 타임라인 뷰
- 감정 통계
- 음악 기반 기억 트리거
- 커뮤니티 기능

---

# 기술 스택

## Phase 1

- HTML
- CSS
- Vanilla JS
- LocalStorage
- IndexedDB

## Phase 2

- React
- Node.js
- Express
- MySQL

---

# 핵심 기술 포인트

## LocalStorage + IndexedDB 분리

- 메타데이터 → LocalStorage
- 이미지 → IndexedDB

이미지 저장 용량 문제를 해결하기 위해 저장소를 분리했습니다.

## 감정 기반 데이터 구조

감정을 단순 텍스트가 아니라 데이터로 관리해:
- 감정 흐름 분석
- 통계 시각화
- 타임라인 표현

이 가능하도록 설계했습니다.

## Empty State UX

빈 화면 이탈 방지를 위해:
- 샘플 데이터 제공
- 첫 기록 유도 UI
를 포함합니다.

---

# 폴더 구조

```txt
life-archive/
├── index.html
├── timeline.html
├── write.html
├── stats.html

├── css/
├── js/
├── assets/
└── data/