fx_version 'adamant'
game 'gta5'
lua54 'yes'

shared_scripts {
    '@es_extended/imports.lua',
    'config.lua'
}

client_scripts {
    'class.lua',
    'cNui.lua',
    'client.lua',
}

server_scripts {
    'class.lua',
    '@oxmysql/lib/MySQL.lua',
    'server.lua'
}

files {
    'html/**'
}

ui_page 'html/index.html'