SOUNDPRINT: SEONGSU — SPATIAL MAP PROTOTYPE V2

[Mac 터미널 실행 방법]

1. ZIP 파일의 압축을 풉니다.
2. soundprint-seongsu-v2 폴더를 바탕화면으로 옮깁니다.
3. 터미널을 실행합니다.
4. 아래 명령어를 그대로 입력합니다.

cd ~/Desktop/soundprint-seongsu-v2/dist
python3 -m http.server 8000

5. Chrome 주소창에 아래 주소를 입력합니다.

http://localhost:8000

6. 종료할 때는 터미널에서 Control + C를 누릅니다.


[현재 구현된 기능]

- 검은 공간 기반의 3D 성수 사운드맵
- 마우스 움직임에 반응하는 지도 원근 이동
- 성수 장소 사진 5개와 공간 연결선
- 장소 사진 클릭 시 전체 화면 그래픽 실험 창
- 사용자가 디자인한 빨간 벽돌·지붕·水 그래픽 모티프 반영
- ROOF PULSE / BRICK SHIFT / FACADE FOLD / PIXEL SCAN / 水 FLOW 실험
- 장소별 기본 실험과 모든 실험 모드 전환
- 마우스 위치와 클릭에 반응하는 그래픽
- 프로토타입 사운드 재생 및 실시간 오디오 반응
- 직접 녹음한 파일 불러오기
- 음량·저주파·고주파·소리 발생·규칙성 슬라이더


[실제 녹음 연결 전 참고]

현재 각 장소의 데이터와 소리는 시각 실험을 위한 임시값입니다.
성수 현장 녹음 후 Python 분석값으로 슬라이더 기본값을 교체하면 됩니다.


[권장 환경]

- Chrome 브라우저
- 이어폰 또는 스피커
- 가로 1280px 이상의 노트북 화면
