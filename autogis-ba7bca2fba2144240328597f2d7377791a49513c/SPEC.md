# AutoGIS Admin Moderation Panel — Technical Specification

Каноническая спецификация по задаче находится в [docs/admin-panel-spec.md](/Users/user/Desktop/autogis/docs/admin-panel-spec.md).

Эта задача фиксирует архитектуру модульной админ-панели, в которой первым реализуемым доменом являются заявки на доступ к профессиональному кабинету.

Ключевые решения:
- админка строится как platform shell для нескольких moderation domains, а не как одноразовый экран под один тип заявки;
- заявка пользователя и кейс модерации разделяются на разные сущности;
- форма заявки становится versioned envelope с `schemaKey`, `schemaVersion` и `payload`;
- backend хранит immutable revisions заявки, чтобы изменения формы не ломали старые данные;
- approve flow становится единственным источником установки `user.isProfessional = true`.

MVP scope:
- очередь кейсов;
- карточка заявки;
- approve / reject / needs_revision;
- assignment;
- audit;
- resubmit после `needs_revision`;
- отключение обходного self-activation пути.

Основной документ:
- [docs/admin-panel-spec.md](/Users/user/Desktop/autogis/docs/admin-panel-spec.md)

Связанная детализация submit-формы:
- [docs/professional-application-submit-form-v2-spec.md](/Users/user/Desktop/autogis/docs/professional-application-submit-form-v2-spec.md)
