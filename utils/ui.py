def add_interviewer_message(message):
    def f(chat, skip=False):
        if chat is None:
            chat = []
        if not skip:
            chat.append((None, message))
        return chat

    return f


def add_candidate_message(message, chat):
    if chat is None:
        chat = []
    if message and len(message) > 0:
        chat.append((message, None))
    return chat


def get_status_color(obj):
    if obj.status:
        if obj.streaming:
            return "🟢"
        return "🟡"
    return "🔴"
