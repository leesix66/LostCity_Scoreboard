# Lost Cities Scorekeeper

모바일 한 화면에서 두 플레이어의 로스트 시티 점수를 동시에 입력하고 라운드별 누적 점수를 관리하는 웹 계산기입니다.

## 점수 규칙

- 시작한 탐험: `(숫자 카드 합 - 20) × (투자 카드 수 + 1)`
- 투자 카드를 포함해 8장 이상인 탐험: 위 계산 뒤 20점 추가
- 시작하지 않은 탐험: 0점
- 각 라운드 점수를 누적해 최종 승자를 결정

공식 규칙: [Thames & Kosmos Lost Cities manual](https://www.thamesandkosmos.com/manuals/full/691820_lostcities2p_manual.pdf)

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증 및 배포

```bash
npm test
npm run build
```

Vercel에서 이 저장소를 Import하면 `vercel.json` 설정으로 자동 배포됩니다.
