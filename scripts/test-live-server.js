const http = require("http");

const BASE_URL = "http://localhost:3005";

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    redirect: "manual",
    ...options,
  });
  return response;
}

async function runLiveServerTests() {
  console.log("================================================================");
  console.log("ACM IARE - LIVE SERVER HTTP & API AUDIT");
  console.log("Target: " + BASE_URL);
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Public Pages (SSR & Static)
  console.log("--- 1. Public Website Pages ---");
  for (const route of ["/", "/about", "/team", "/gallery", "/contact", "/events"]) {
    try {
      const res = await makeRequest(route);
      assert(res.status === 200, `Public route '${route}' returned HTTP ${res.status}`);
    } catch (err) {
      assert(false, `Public route '${route}' failed: ${err.message}`);
    }
  }

  // 2. Unauthenticated Security Shield (Proxy Redirects)
  console.log("\n--- 2. Unauthenticated Route Shielding ---");
  try {
    const adminRes = await makeRequest("/admin");
    assert(
      adminRes.status === 307 || adminRes.status === 302,
      `Unauthenticated '/admin' redirected with HTTP ${adminRes.status} (Location: ${adminRes.headers.get("location")})`
    );

    const studioRes = await makeRequest("/studio");
    assert(
      studioRes.status === 307 || studioRes.status === 302,
      `Unauthenticated '/studio' redirected with HTTP ${studioRes.status} (Location: ${studioRes.headers.get("location")})`
    );

    const studioEditRes = await makeRequest("/studio/edit/gallery");
    assert(
      studioEditRes.status === 307 || studioEditRes.status === 302,
      `Unauthenticated '/studio/edit/gallery' redirected with HTTP ${studioEditRes.status}`
    );

    const apiStudioRes = await makeRequest("/api/studio/pages");
    assert(
      apiStudioRes.status === 401 || apiStudioRes.status === 307,
      `Unauthenticated '/api/studio/pages' blocked with HTTP ${apiStudioRes.status}`
    );
  } catch (err) {
    assert(false, `Route shielding test error: ${err.message}`);
  }

  // 3. Admin Authentication Login Flow
  console.log("\n--- 3. Admin Authentication Flow ---");
  let sessionCookie = "";
  try {
    const loginRes = await makeRequest("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "acmiare2026admin",
      }),
    });

    assert(loginRes.status === 200, `Login endpoint '/api/admin/auth' returned HTTP ${loginRes.status}`);
    const data = await loginRes.json();
    assert(data.success === true, "Login response indicates success: true");

    const setCookie = loginRes.headers.get("set-cookie");
    assert(Boolean(setCookie), "Received session cookie in Set-Cookie response header");
    if (setCookie) {
      sessionCookie = setCookie.split(";")[0];
    }
  } catch (err) {
    assert(false, `Admin authentication flow failed: ${err.message}`);
  }

  // 4. Studio CMS APIs with Authenticated Session
  console.log("\n--- 4. Studio CMS Operations with Active Admin Session ---");
  if (sessionCookie) {
    const authHeaders = {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
    };

    try {
      // List all manageable pages
      const pagesRes = await makeRequest("/api/studio/pages", { headers: authHeaders });
      assert(pagesRes.status === 200, `/api/studio/pages returned HTTP ${pagesRes.status}`);
      const pagesData = await pagesRes.json();
      assert(Array.isArray(pagesData.pages), `Returned ${pagesData.pages?.length || 0} manageable CMS pages`);

      // Load gallery page
      const galleryRes = await makeRequest("/api/studio/pages/gallery", { headers: authHeaders });
      assert(galleryRes.status === 200, `GET /api/studio/pages/gallery returned HTTP 200`);
      const galleryData = await galleryRes.json();
      assert(galleryData.page?.slug === "gallery", "Retrieved CMS page model for 'gallery'");

      // Save draft update
      const activeContent = galleryData.page.draft_content || galleryData.page.published_content || {};
      const testDraft = {
        ...activeContent,
        testFieldAudit: "Verified by automated e2e suite at " + new Date().toISOString(),
      };

      const putDraftRes = await makeRequest("/api/studio/pages/gallery", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ draftContent: testDraft }),
      });
      assert(putDraftRes.status === 200, `PUT /api/studio/pages/gallery (Save Draft) returned HTTP 200`);
      const putDraftData = await putDraftRes.json();
      assert(putDraftData.success === true, "Draft saved successfully into Neon PostgreSQL");

      // Verify draft saved
      const verifyDraftRes = await makeRequest("/api/studio/pages/gallery", { headers: authHeaders });
      const verifyDraftData = await verifyDraftRes.json();
      assert(
        Boolean(verifyDraftData.page?.draft_content?.testFieldAudit),
        "Draft content isolated in draft_content and verified"
      );

      // Publish revision
      const publishRes = await makeRequest("/api/studio/pages/gallery", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ changeSummary: "Automated end-to-end audit release" }),
      });
      assert(publishRes.status === 200, `POST /api/studio/pages/gallery (Publish) returned HTTP 200`);
      const publishData = await publishRes.json();
      assert(typeof publishData.newVersion === "number", `New revision version created: #${publishData.newVersion}`);

      // List revisions
      const revsRes = await makeRequest("/api/studio/pages/gallery/revisions", { headers: authHeaders });
      assert(revsRes.status === 200, `GET /api/studio/pages/gallery/revisions returned HTTP 200`);
      const revsData = await revsRes.json();
      assert(Array.isArray(revsData.revisions) && revsData.revisions.length > 0, "Revision history log confirmed in Neon");

      // Media Library check
      const mediaRes = await makeRequest("/api/studio/media", { headers: authHeaders });
      assert(mediaRes.status === 200, `GET /api/studio/media returned HTTP 200`);
      const mediaData = await mediaRes.json();
      assert(Array.isArray(mediaData.media), `Media library query returned ${mediaData.media?.length || 0} assets`);

    } catch (apiErr) {
      assert(false, `Authenticated API test error: ${apiErr.message}`);
    }
  } else {
    assert(false, "Skipping authenticated API tests because session cookie could not be acquired");
  }

  // -----------------------------------------------------------------
  // Final Results
  // -----------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`LIVE SERVER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveServerTests().catch((err) => {
  console.error("FATAL ERROR IN LIVE SERVER AUDIT:", err);
  process.exit(1);
});
