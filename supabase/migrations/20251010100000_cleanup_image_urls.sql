update public.educational_materials
set image_url = 'public/' || regexp_replace(
  image_url,
  '.*/storage/v1/object/(?:public|sign)/educational_materials/',
  ''
)
where image_url ~ 'https?://.*/storage/v1/object/(public|sign)/educational_materials/.+'
  and image_url not like 'public/%';

update public.educational_materials
set image_url = 'public/' || image_url
where image_url is not null
  and image_url not like 'http%'
  and image_url not like 'public/%';
