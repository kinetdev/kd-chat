Config = {}

Config.Channel = {
    ['all'] = {
        id = 1,
        label = 'Chat tổng',
        icon = 'fi fi-rr-world',
        messages = {},
    },
    ['group'] = {
        id = 2,
        label = 'Hội nhóm',
        icon = 'fi fi-rr-users-alt',
        messages = {},
        private = true,
    },
    ['trading'] = {
        id = 3,
        label = 'Mua bán',
        icon = 'fi fi-rr-shopping-cart-add',
        messages = {},
        money = 10000
    },
    ['system'] = {
        id = 4,
        label = 'Hệ thống',
        icon = 'fi fi-rr-laptop-mobile',
        messages = {},
        disablechat = true,
    },
}

Config.NameTag = {
    ['default'] = {
        label = '',
        color = 'black'
    },
    ['police'] = {
        label = '[Cảnh Sát]',
        color = 'blue',
    },
    ['ambulance'] = {
        label = '[Bác Sĩ]',
        color = 'pink',
    },
}