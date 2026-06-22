import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from requests_oauthlib import OAuth2Session

client_id = "Sg1pSY263YW-RDZT23uF9DhLc9tzCq14D6qXvGXJYkw"
client_secret = "kEBz9LBufV6P5Hkk6-06IUbPD2g_FDb0-rYwYbBFuGw"
redirect_uri = "http://127.0.0.1:8080/callback"

# ---- AUTH (reuse if you already have token) ----
osm = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=["write_api"])

auth_url, state = osm.authorization_url(
    "https://www.openstreetmap.org/oauth2/authorize"
)
print("Go here:", auth_url)

redirect_response = input("Paste redirect URL: ")

token = osm.fetch_token(
    "https://www.openstreetmap.org/oauth2/token",
    authorization_response=redirect_response,
    client_secret=client_secret
)

# ---- YOUR DATA ----
lat = 49.140317
lon = 18.0081

# ---- 1. CREATE CHANGESET ----
changeset_xml = """<?xml version="1.0" encoding="UTF-8"?>
<osm>
  <changeset>
    <tag k="created_by" v="bookcase-script"/>
    <tag k="comment" v="Add public bookcase"/>
  </changeset>
</osm>
"""

r = osm.put(
    "https://api.openstreetmap.org/api/0.6/changeset/create",
    data=changeset_xml,
    headers={"Content-Type": "text/xml"}
)

changeset_id = r.text.strip()
print("Changeset:", changeset_id)

# ---- 2. CREATE NODE ----
node_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<osm>
  <node changeset="{changeset_id}" lat="{lat}" lon="{lon}">
    <tag k="amenity" v="public_bookcase"/>
    <tag k="access" v="yes"/>
  </node>
</osm>
"""

r = osm.put(
    "https://api.openstreetmap.org/api/0.6/node/create",
    data=node_xml,
    headers={"Content-Type": "text/xml"}
)

node_id = r.text.strip()
print("Created node:", node_id)

# ---- 3. CLOSE CHANGESET ----
osm.put(f"https://api.openstreetmap.org/api/0.6/changeset/{changeset_id}/close")

print("Done 🎉")