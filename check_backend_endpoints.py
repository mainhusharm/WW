"""
Check what endpoints are available on the existing backend
"""

import requests
import json
from datetime import datetime

def check_backend_endpoints():
    backend_url = "https://backend-topb.onrender.com"
    
    print(f"Checking backend endpoints at: {backend_url}")
    print("=" * 60)
    
    # Common endpoints to test
    endpoints_to_test = [
        "/",
        "/api",
        "/api/health",
        "/health",
        "/status",
        "/api/users",
        "/api/user/register",
        "/api/register",
        "/api/signup",
        "/api/auth/register",
        "/api/enhanced/signup",
        "/api/working/health",
        "/api/working/register"
    ]
    
    results = []
    
    for endpoint in endpoints_to_test:
        url = f"{backend_url}{endpoint}"
        try:
            print(f"Testing: {endpoint} ... ", end="")
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print(f" - Available")
                try:
                    data = response.json()
                    results.append({
                        'endpoint': endpoint,
                        'status': response.status_code,
                        'available': True,
                        'response': data
                    })
                except:
                    results.append({
                        'endpoint': endpoint,
                        'status': response.status_code,
                        'available': True,
                        'response': response.text[:200]
                    })
            elif response.status_code == 404:
                print(f" - Not Found")
                results.append({
                    'endpoint': endpoint,
                    'status': response.status_code,
                    'available': False,
                    'response': 'Not Found'
                })
            elif response.status_code == 405:
                print(f" - Method Not Allowed (endpoint exists)")
                results.append({
                    'endpoint': endpoint,
                    'status': response.status_code,
                    'available': True,
                    'response': 'Method Not Allowed - try POST'
                })
            else:
                print(f" - {response.status_code} - {response.reason}")
                results.append({
                    'endpoint': endpoint,
                    'status': response.status_code,
                    'available': True,
                    'response': response.text[:200]
                })
                
        except requests.exceptions.Timeout:
            print(" - Timeout")
            results.append({
                'endpoint': endpoint,
                'status': 'timeout',
                'available': False,
                'response': 'Request timed out'
            })
        except requests.exceptions.ConnectionError:
            print(" - Connection Error")
            results.append({
                'endpoint': endpoint,
                'status': 'connection_error',
                'available': False,
                'response': 'Connection failed'
            })
        except Exception as e:
            print(f" - Error: {e}")
            results.append({
                'endpoint': endpoint,
                'status': 'error',
                'available': False,
                'response': str(e)
            })
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    available_endpoints = [r for r in results if r['available']]
    unavailable_endpoints = [r for r in results if not r['available']]
    
    print(f"Available endpoints: {len(available_endpoints)}")
    print(f"Unavailable endpoints: {len(unavailable_endpoints)}")
    
    if available_endpoints:
        print("\nAVAILABLE ENDPOINTS:")
        for result in available_endpoints:
            print(f"  {result['endpoint']} - Status: {result['status']}")
            if isinstance(result['response'], dict):
                print(f"    Response: {json.dumps(result['response'], indent=4)}")
            else:
                print(f"    Response: {result['response']}")
    
    if unavailable_endpoints:
        print("\nUNAVAILABLE ENDPOINTS:")
        for result in unavailable_endpoints:
            print(f"  {result['endpoint']} - {result['response']}")
    
    # Save results
    with open('backend_endpoint_check.json', 'w') as f:
        json.dump({
            'backend_url': backend_url,
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'summary': {
                'total_tested': len(endpoints_to_test),
                'available': len(available_endpoints),
                'unavailable': len(unavailable_endpoints)
            }
        }, f, indent=2)
    
    print(f"\nResults saved to: backend_endpoint_check.json")
    
    return results

if __name__ == "__main__":
    check_backend_endpoints()
