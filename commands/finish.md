---
description: "현재 feature의 마무리 시퀀스(Completion Protocol) 직행 실행"
---

이 커맨드 호출 자체가 사용자의 완료 선언이다. 마무리 트리거 감지를 생략하고 즉시 시퀀스를 시작하라.

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/workflow-orchestrator/references/completion-protocol.md` using the Read tool and follow its instructions exactly.

주의: 이 커맨드는 Superpowers의 finishing-a-development-branch 스킬과 별개다 — 여기서는 dev-workflow의 문서 취합·커밋·푸시 시퀀스만 수행한다.
대상 feature가 불명확하면(미완료 feature 2개 이상) 목록을 제시하고 사용자가 지정한 것만 진행한다.
